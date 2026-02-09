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

import { setText } from "@/dom/text/implementation";
import { event } from "@/events/implementation";
import { parseStateScript } from "@/hydration/deserialize/implementation";
import {
  createWalker,
  findMarker,
  getTextNodeAfterMarker,
  HydrationMarkerType,
  type MarkerInfo,
} from "@/hydration/walker/implementation";

/**
 * WeakMap to track hydrated ShadowRoots (idempotency).
 */
const hydratedRoots = new WeakMap<ShadowRoot, boolean>();

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
  /** Text effect handlers: marker id -> update function */
  textHandlers: Map<number, (value: unknown) => void>;
  /** Event handlers to connect */
  eventHandlers: Map<Element, Map<string, EventListener>>;
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
function createHydrationContext(root: ShadowRoot): HydrationContext {
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
    textHandlers: new Map(),
    eventHandlers: new Map(),
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
): RootDispose | null {
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
  const ctx = createHydrationContext(root);

  // Create cleanup scope and run setup
  const dispose = createRoot(() => {
    setup(ctx);
  });

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
): RootDispose | null {
  return hydrateRoot(root, (ctx) => {
    // Process text bindings
    if (bindings.texts) {
      for (const marker of ctx.markers) {
        if (marker.type === HydrationMarkerType.Text) {
          const getValue = bindings.texts.get(marker.id);
          if (getValue) {
            hydrateTextMarker(marker, getValue);
          }
        }
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
  });
}

export {
  createHydrationContext,
  handleMismatch,
  hydrate,
  hydrateRoot,
  hydrateTextMarker,
  HydrationMismatchError,
  isHydrated,
  markHydrated,
  nextMarker,
};
export type { HydrationContext };
