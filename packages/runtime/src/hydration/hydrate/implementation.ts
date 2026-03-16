/**
 * Main Hydration logic.
 *
 * Per SPEC.typ (Behavior Spec: Hydration):
 * - Reuses SSR-generated DOM
 * - Connects events and reactivity simultaneously
 * - Uses WeakMap for idempotency (prevents double hydration)
 * - Dev mode throws on mismatch, prod mode warns and falls back to CSR
 */

import {
  createRoot,
  templateEffect,
  type RootDispose,
} from "@dathomir/reactivity";
import { withStore } from "@dathomir/store";

import { setText } from "@/dom/text/implementation";
import { event } from "@/events/implementation";
import {
  parseStateScript,
  parseStoreScript,
} from "@/hydration/deserialize/implementation";
import {
  createWalker,
  findMarker,
  getTextNodeAfterMarker,
  HydrationMarkerType,
  type MarkerInfo,
} from "@/hydration/walker/implementation";

import type {
  AtomStore,
  AtomStoreSnapshot,
  PrimitiveAtom,
} from "@dathomir/store";

/**
 * WeakMap to track hydrated ShadowRoots (idempotency).
 */
const hydratedRoots = new WeakMap<ShadowRoot, boolean>();
const scheduledIslandCleanups = new WeakMap<HTMLElement, () => void>();

const HYDRATE_ISLANDS_HOOK = Symbol("dathomir.hydrateIslandsHook");
const HYDRATE_ISLANDS_STATUS = Symbol("dathomir.hydrateIslandsStatus");

type IslandsStrategyName =
  | "load"
  | "visible"
  | "idle"
  | "interaction"
  | "media";
type HydrateIslandsStatus = "idle" | "hydrated";
interface IslandHydrationTrigger {
  readonly strategy: string;
  readonly eventType?: string;
  readonly replayTargetId?: string | null;
}
type HydrateIslandHook = (trigger?: IslandHydrationTrigger) => boolean;

interface IslandHost extends HTMLElement {
  [HYDRATE_ISLANDS_HOOK]?: HydrateIslandHook;
  [HYDRATE_ISLANDS_STATUS]?: HydrateIslandsStatus;
}

interface IdleCallbackDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

type RequestIdleCallback = (
  callback: (deadline: IdleCallbackDeadline) => void,
) => number;
type CancelIdleCallback = (handle: number) => void;

/**
 * Hydration context for tracking state during hydration.
 */
interface HydrationContext {
  /** Parsed state from SSR */
  state: Record<string, unknown>;
  /** TreeWalker for marker traversal */
  walker: TreeWalker;
  /** Collected markers */
  markers: MarkerInfo[];
  /** Current marker index */
  markerIndex: number;
  /** Event handlers to connect */
  eventHandlers: Map<Element, Map<string, EventListener>>;
  /** Optional request/root-scoped store */
  store?: AtomStore;
}

interface HydrationOptions {
  store?: AtomStore;
  storeSnapshotSchema?: AtomStoreSnapshot<
    Record<string, PrimitiveAtom<unknown>>
  >;
}

/**
 * Hydration mismatch error.
 */
class HydrationMismatchError extends Error {
  /** The marker ID associated with the mismatch, if available. */
  markerId: number | null;
  /** The marker type associated with the mismatch, if available. */
  markerType: string | null;
  /** Description of expected DOM state. */
  expected: string | null;
  /** Description of actual DOM state. */
  actual: string | null;

  constructor(
    message: string,
    details?: {
      markerId?: number;
      markerType?: string;
      expected?: string;
      actual?: string;
    },
  ) {
    const detailLines: string[] = [];
    if (details?.markerId !== undefined) {
      detailLines.push(`  Marker ID: ${details.markerId}`);
    }
    if (details?.markerType !== undefined) {
      detailLines.push(`  Marker type: ${details.markerType}`);
    }
    if (details?.expected !== undefined) {
      detailLines.push(`  Expected: ${details.expected}`);
    }
    if (details?.actual !== undefined) {
      detailLines.push(`  Actual: ${details.actual}`);
    }
    const detailStr =
      detailLines.length > 0 ? `\n${detailLines.join("\n")}` : "";
    super(`[dathomir] Hydration mismatch: ${message}${detailStr}`);
    this.name = "HydrationMismatchError";
    this.markerId = details?.markerId ?? null;
    this.markerType = details?.markerType ?? null;
    this.expected = details?.expected ?? null;
    this.actual = details?.actual ?? null;
  }
}

/**
 * Check if a ShadowRoot has already been hydrated.
 */
function isHydrated(root: ShadowRoot): boolean {
  return hydratedRoots.has(root);
}

/**
 * Mark a ShadowRoot as hydrated.
 */
function markHydrated(root: ShadowRoot): void {
  hydratedRoots.set(root, true);
}

/**
 * Handle hydration mismatch.
 * Dev mode: throw error
 * Prod mode: warn and return false (caller should fallback to CSR)
 */
function handleMismatch(
  message: string,
  details?: {
    markerId?: number;
    markerType?: string;
    expected?: string;
    actual?: string;
  },
): boolean {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    throw new HydrationMismatchError(message, details);
  }
  console.warn(
    `[dathomir] Hydration mismatch: ${message}. Falling back to CSR.`,
  );
  return false;
}

/**
 * Create a hydration context.
 */
function createHydrationContext(
  root: ShadowRoot,
  options: HydrationOptions = {},
): HydrationContext {
  const state = parseStateScript(root) ?? {};
  const walker = createWalker(root);
  const markers: MarkerInfo[] = [];

  // Collect all markers
  let marker = findMarker(walker);
  while (marker) {
    markers.push(marker);
    marker = findMarker(walker);
  }

  return {
    state,
    walker,
    markers,
    markerIndex: 0,
    eventHandlers: new Map(),
    store: options.store,
  };
}

/**
 * Get next marker from context.
 */
function nextMarker(ctx: HydrationContext): MarkerInfo | null {
  if (ctx.markerIndex >= ctx.markers.length) {
    return null;
  }
  return ctx.markers[ctx.markerIndex++];
}

/**
 * Hydrate text markers.
 * Connects templateEffect to update text content reactively.
 */
function hydrateTextMarker(marker: MarkerInfo, getValue: () => unknown): void {
  const textNode = getTextNodeAfterMarker(marker.node);
  if (!textNode) {
    handleMismatch(`Text node not found after marker ${marker.id}`, {
      markerId: marker.id,
      markerType: marker.type,
      expected: "Text node after comment marker",
      actual: marker.node.nextSibling
        ? `${marker.node.nextSibling.nodeName} (nodeType: ${marker.node.nextSibling.nodeType})`
        : "no sibling node",
    });
    return;
  }

  // Connect reactive update
  templateEffect(() => {
    setText(textNode, getValue());
  });
}

function isIslandHost(value: Element): value is IslandHost {
  return value instanceof HTMLElement;
}

function getIslandStrategy(host: Element): IslandsStrategyName | null {
  const strategy = host.getAttribute("data-dh-island");

  switch (strategy) {
    case "load":
    case "visible":
    case "idle":
    case "interaction":
    case "media":
      return strategy;
    default:
      return null;
  }
}

function getInteractionEventType(host: Element): string {
  return host.getAttribute("data-dh-island-value") ?? "click";
}

function getMediaQuery(host: Element): string | null {
  return host.getAttribute("data-dh-island-value");
}

function getReplayTargetIdFromEvent(event: Event): string | null {
  const path =
    typeof event.composedPath === "function" ? event.composedPath() : [];

  for (const item of path) {
    if (!(item instanceof HTMLElement)) {
      continue;
    }

    const targetId = item.getAttribute("data-dh-client-target");
    if (targetId !== null) {
      return targetId;
    }
  }

  return null;
}

function collectIslandHosts(
  root: Document | ShadowRoot | Element,
  hosts: IslandHost[] = [],
): IslandHost[] {
  if (
    root instanceof Element &&
    isIslandHost(root) &&
    getIslandStrategy(root)
  ) {
    hosts.push(root);
  }

  if (root instanceof Element && root.shadowRoot !== null) {
    collectIslandHosts(root.shadowRoot, hosts);
  }

  const children =
    root instanceof Document ||
    root instanceof ShadowRoot ||
    root instanceof Element
      ? Array.from(root.children)
      : [];

  for (const child of children) {
    collectIslandHosts(child, hosts);
  }

  return hosts;
}

function runIslandHydration(host: IslandHost): boolean {
  return runIslandHydrationWithTrigger(host);
}

function runIslandHydrationWithTrigger(
  host: IslandHost,
  trigger?: IslandHydrationTrigger,
): boolean {
  if (host[HYDRATE_ISLANDS_STATUS] === "hydrated") {
    return false;
  }

  const hydrateHook = host[HYDRATE_ISLANDS_HOOK];
  if (typeof hydrateHook !== "function") {
    return false;
  }

  const didHydrate = hydrateHook(trigger);
  if (didHydrate) {
    host[HYDRATE_ISLANDS_STATUS] = "hydrated";
  }

  return didHydrate;
}

function scheduleIslandHydration(host: IslandHost): (() => void) | null {
  if (
    scheduledIslandCleanups.has(host) ||
    host[HYDRATE_ISLANDS_STATUS] === "hydrated"
  ) {
    return null;
  }

  const strategy = getIslandStrategy(host);
  if (strategy === null || typeof host[HYDRATE_ISLANDS_HOOK] !== "function") {
    return null;
  }

  let active = true;
  let cleanup = () => {};

  const finish = (trigger?: IslandHydrationTrigger) => {
    if (!active) {
      return;
    }

    active = false;
    cleanup();
    scheduledIslandCleanups.delete(host);
    runIslandHydrationWithTrigger(host, trigger);
  };

  switch (strategy) {
    case "load": {
      if (document.readyState === "complete") {
        finish();
        return null;
      }

      const onLoad = () => {
        finish();
      };
      window.addEventListener("load", onLoad, { once: true });
      cleanup = () => {
        window.removeEventListener("load", onLoad);
      };
      break;
    }

    case "visible": {
      if (typeof IntersectionObserver === "undefined") {
        finish();
        return null;
      }

      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === host && entry.isIntersecting) {
            finish();
            return;
          }
        }
      });

      observer.observe(host);
      cleanup = () => {
        observer.disconnect();
      };
      break;
    }

    case "idle": {
      const requestIdle = globalThis.requestIdleCallback as
        | RequestIdleCallback
        | undefined;
      const cancelIdle = globalThis.cancelIdleCallback as
        | CancelIdleCallback
        | undefined;

      if (typeof requestIdle === "function") {
        const handle = requestIdle(() => {
          finish();
        });
        cleanup = () => {
          cancelIdle?.(handle);
        };
        break;
      }

      const timeoutHandle = window.setTimeout(() => {
        finish();
      }, 0);
      cleanup = () => {
        window.clearTimeout(timeoutHandle);
      };
      break;
    }

    case "interaction": {
      const eventType = getInteractionEventType(host);
      const onInteraction = (event: Event) => {
        finish({
          strategy,
          eventType,
          replayTargetId: getReplayTargetIdFromEvent(event),
        });
      };
      host.addEventListener(eventType, onInteraction, { once: true });
      cleanup = () => {
        host.removeEventListener(eventType, onInteraction);
      };
      break;
    }

    case "media": {
      const query = getMediaQuery(host);
      if (query === null || typeof window.matchMedia !== "function") {
        finish();
        return null;
      }

      const mediaQueryList = window.matchMedia(query);
      if (mediaQueryList.matches) {
        finish();
        return null;
      }

      const onChange = (event: MediaQueryListEvent | MediaQueryList) => {
        if (event.matches) {
          finish();
        }
      };

      if (typeof mediaQueryList.addEventListener === "function") {
        mediaQueryList.addEventListener("change", onChange);
        cleanup = () => {
          mediaQueryList.removeEventListener("change", onChange);
        };
      } else {
        mediaQueryList.addListener(onChange);
        cleanup = () => {
          mediaQueryList.removeListener(onChange);
        };
      }
      break;
    }
  }

  const dispose = () => {
    if (!active) {
      return;
    }

    active = false;
    cleanup();
    scheduledIslandCleanups.delete(host);
  };

  scheduledIslandCleanups.set(host, dispose);
  return dispose;
}

function cancelScheduledIslandHydration(host: HTMLElement): void {
  scheduledIslandCleanups.get(host)?.();
}

function hydrateIslands(
  root: Document | ShadowRoot | Element = document,
): () => void {
  const scheduledByCall: Array<() => void> = [];

  for (const host of collectIslandHosts(root)) {
    const cleanup = scheduleIslandHydration(host);
    if (cleanup !== null) {
      scheduledByCall.push(cleanup);
    }
  }

  return () => {
    for (const cleanup of scheduledByCall) {
      cleanup();
    }
  };
}

/**
 * Hydrate a ShadowRoot.
 *
 * Per SPEC.typ (Behavior Spec: Hydration):
 * 1. Check if already hydrated (idempotency via WeakMap)
 * 2. Parse state script and initialize Signals
 * 3. Create cleanup scope with createRoot
 * 4. Traverse markers with TreeWalker
 * 5. Connect effects and events simultaneously
 * 6. Mark as hydrated
 *
 * @param root The ShadowRoot to hydrate
 * @param setup Setup function that returns event and effect bindings
 * @returns Dispose function or null if already hydrated
 */
function hydrateRoot(
  root: ShadowRoot,
  setup: (ctx: HydrationContext) => void,
  options: HydrationOptions = {},
): RootDispose | null {
  if (
    options.storeSnapshotSchema !== undefined &&
    options.store === undefined
  ) {
    throw new Error("[dathomir] storeSnapshotSchema requires a store");
  }

  // Check closed shadow root
  if (root.mode === "closed") {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("[dathomir] Cannot hydrate closed ShadowRoot");
    }
    return null;
  }

  // Idempotency: skip if already hydrated
  if (isHydrated(root)) {
    return null;
  }

  // Create hydration context
  const ctx = createHydrationContext(root, options);

  if (
    options.storeSnapshotSchema !== undefined &&
    options.store !== undefined
  ) {
    const snapshot = parseStoreScript(root);
    if (snapshot !== null) {
      options.storeSnapshotSchema.hydrate(options.store, snapshot as never);
    }
  }

  // Create cleanup scope and run setup
  const runSetup = () =>
    createRoot(() => {
      setup(ctx);
    });
  const dispose =
    options.store === undefined
      ? runSetup()
      : withStore(options.store, runSetup);

  // Mark as hydrated
  markHydrated(root);

  return dispose;
}

/**
 * Simple hydrate function for basic cases.
 * Hydrates a container by connecting reactive bindings.
 */
function hydrate(
  root: ShadowRoot,
  bindings: {
    /** Text bindings: marker id -> value getter */
    texts?: Map<number, () => unknown>;
    /** Event bindings: element -> event type -> handler */
    events?: Map<Element, Map<string, EventListener>>;
  },
  options: HydrationOptions = {},
): RootDispose | null {
  return hydrateRoot(
    root,
    (ctx) => {
      // Process text bindings
      if (bindings.texts) {
        let marker = nextMarker(ctx);
        while (marker !== null) {
          if (marker.type === HydrationMarkerType.Text) {
            const getValue = bindings.texts.get(marker.id);
            if (getValue) {
              hydrateTextMarker(marker, getValue);
            }
          }

          marker = nextMarker(ctx);
        }
      }

      // Process event bindings
      if (bindings.events) {
        for (const [element, handlers] of bindings.events) {
          for (const [eventType, handler] of handlers) {
            event(eventType, element, handler);
          }
        }
      }
    },
    options,
  );
}

export {
  cancelScheduledIslandHydration,
  createHydrationContext,
  handleMismatch,
  hydrate,
  hydrateIslands,
  hydrateRoot,
  hydrateTextMarker,
  HydrationMismatchError,
  HydrationMarkerType,
  HYDRATE_ISLANDS_HOOK,
  HYDRATE_ISLANDS_STATUS,
  isHydrated,
  markHydrated,
};
export type {
  HydrateIslandHook,
  HydrateIslandsStatus,
  HydrationContext,
  IslandHydrationTrigger,
  IslandHost,
};
