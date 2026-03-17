/**
 * defineComponent - High-level API for defining Web Components.
 *
 * Automates: Shadow DOM setup, createRoot lifecycle, DSD hydration detection,
 * adoptedStyleSheets, and props reflection with reactive signals and type coercion.
 * @module
 */
import {
  connectGlobalStyles,
  disconnectGlobalStyles,
  getCssText,
} from "@/css/implementation";
import {
  bindCurrentStoreToSubtree,
  captureCurrentStore,
  getStoreFromHost,
  peekStoreFromHost,
} from "@/defineComponent/internal";
import { registerComponent } from "@/registry/implementation";
import { ensureComponentRenderer, renderDSD } from "@/ssr/implementation";
import type { RootDispose, Signal } from "@dathomir/reactivity";
import { createRoot, signal, templateEffect } from "@dathomir/reactivity";
import {
  cancelScheduledIslandHydration,
  HYDRATE_ISLANDS_HOOK,
  HYDRATE_ISLANDS_STATUS,
} from "@dathomir/runtime/hydration";
import { insert, setAttr } from "@dathomir/runtime";
import type { AtomStore } from "@dathomir/store";

// ── Type definitions ────────────────────────────────────────────────

/** Supported prop type constructors or custom coercion functions. */
type PropType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ((value: string | null) => unknown);

/** Definition for a single prop (type, default, attribute mapping). */
interface PropDefinition {
  /** Constructor or coercion function for attribute→value conversion. */
  type: PropType;
  /** Default value when attribute is absent. Falls back to type default. */
  default?: unknown;
  /** Attribute name override, or `false` to disable attribute observation. */
  attribute?: string | false;
}

/** Schema mapping prop names to their definitions. */
type PropsSchema = Record<string, PropDefinition>;

/** Infer the runtime type from a PropDefinition's type field. */
type InferPropType<D extends PropDefinition> = D extends {
  type: StringConstructor;
}
  ? string
  : D extends { type: NumberConstructor }
    ? number
    : D extends { type: BooleanConstructor }
      ? boolean
      : D extends { type: (v: string | null) => infer R }
        ? R
        : unknown;

/** Map a PropsSchema to an object of reactive signals. */
type InferProps<S extends PropsSchema> = {
  readonly [K in keyof S]: Signal<InferPropType<S[K]>>;
};

/**
 * Function component that receives reactive props as signals.
 * Props can be accessed via .value and will reactively update when attributes change.
 */
type FunctionComponent<S extends PropsSchema = PropsSchema> = (
  ctx: ComponentContext<S>,
) => Node | DocumentFragment | string;

/** Internal setup function with host and context. @internal */
type SetupFunction<S extends PropsSchema = PropsSchema> = (
  host: HTMLElement,
  ctx: ComponentContext<S>,
) => Node | DocumentFragment | string;

/** Context passed to setup and hydrate functions. */
interface ComponentContext<S extends PropsSchema = PropsSchema> {
  readonly host: HTMLElement;
  readonly props: Readonly<InferProps<S>>;
  readonly client: ComponentClientContext;
  readonly store: AtomStore;
}

interface ComponentClientContext {
  readonly strategy: string | null;
  readonly value: string | null;
  readonly hydrated: boolean;
}

interface JSXReactiveValue<T> {
  readonly value: T;
}

type JSXPropValue<T> = T | JSXReactiveValue<T>;

interface IslandsDirectiveJSXProps {
  readonly "client:load"?: true | "";
  readonly "client:visible"?: true | "";
  readonly "client:idle"?: true | "";
  readonly "client:interaction"?: true | "" | string;
  readonly "client:media"?: string;
}

const KNOWN_ISLAND_STRATEGIES = new Set([
  "load",
  "visible",
  "idle",
  "interaction",
  "media",
]);

interface IslandHydrationTrigger {
  readonly strategy: string;
  readonly eventType?: string;
  readonly replayTargetId?: string | null;
}

/** Props accepted by the JSX helper component returned from defineComponent. */
type JSXComponentProps<S extends PropsSchema = Record<string, never>> = {
  readonly [K in keyof S]?: JSXPropValue<InferPropType<S[K]>>;
} & {
  readonly children?: unknown;
} & IslandsDirectiveJSXProps;

/** Options for defineComponent. */
interface ComponentOptions<S extends PropsSchema = PropsSchema> {
  /** CSS styles to apply via adoptedStyleSheets. */
  styles?: readonly (CSSStyleSheet | string)[];
  /** Props schema defining observed attributes with type coercion. */
  props?: S;
  /** Hydration setup function for Declarative Shadow DOM. */
  hydrate?: HydrateSetupFunction<S>;
}

/** Component class with tag name and schema metadata. */
interface ComponentMetadata<S extends PropsSchema = PropsSchema> {
  readonly __tagName__: string;
  readonly __propsSchema__?: S;
}

/** Component class with tag name and schema metadata. */
interface ComponentClass<S extends PropsSchema = PropsSchema>
  extends Function,
    ComponentMetadata<S> {}

/** Constructor type returned by defineComponent. */
type ComponentConstructor<S extends PropsSchema = PropsSchema> = {
  new (): HTMLElement & { [K in keyof S]: InferPropType<S[K]> };
  readonly prototype: HTMLElement;
} & ComponentClass<S>;

/** JSX helper component returned by defineComponent. */
type JSXComponent<S extends PropsSchema = Record<string, never>> = (
  props: JSXComponentProps<S> | null,
) => Node;

/** Public object returned by defineComponent. */
interface DefinedComponent<S extends PropsSchema = Record<string, never>>
  extends ComponentMetadata<S> {
  (props: JSXComponentProps<S> | null): Node;
  readonly webComponent: ComponentConstructor<S>;
  readonly jsx: JSXComponent<S>;
}

/** TSX helper: derive element attribute types from a ComponentClass. */
type ComponentElement<C> =
  C extends ComponentMetadata<infer S>
    ? JSXComponentProps<S>
    : Record<string, unknown>;

/** Function that hydrates existing DSD content without creating new DOM. */
type HydrateSetupFunction<S extends PropsSchema = PropsSchema> = (
  ctx: ComponentContext<S>,
) => void;

// ── Internal helpers ────────────────────────────────────────────────

/**
 * Get the default value for a PropDefinition.
 * @internal
 */
function getDefaultValue(def: PropDefinition): unknown {
  if (def.default !== undefined) return def.default;
  if (def.type === String) return "";
  if (def.type === Number) return 0;
  if (def.type === Boolean) return false;
  return undefined;
}

/**
 * Coerce an attribute string (or null) to the typed value.
 * @internal
 */
function coerceValue(def: PropDefinition, attrValue: string | null): unknown {
  if (def.type === Boolean) {
    // Boolean attributes: presence = true, absence (null) = false
    return attrValue !== null;
  }
  if (def.type === Number) {
    // Per SPEC: null → default value (Number(null) = 0 would hide the real default)
    if (attrValue === null) return getDefaultValue(def);
    return Number(attrValue);
  }
  if (def.type === String) {
    // Per SPEC: null → default value
    if (attrValue === null) return getDefaultValue(def);
    return attrValue;
  }
  // Custom coercion function - pass null through as per SPEC
  if (typeof def.type === "function") {
    return def.type(attrValue);
  }
  // Fallback for null with no custom function
  if (attrValue === null) {
    return getDefaultValue(def);
  }
  return attrValue;
}

/**
 * Derive the attribute name for a prop.
 * Returns null if `attribute: false` (property-only prop).
 * @internal
 */
function attrNameForProp(propName: string, def: PropDefinition): string | null {
  if (def.attribute === false) return null;
  return typeof def.attribute === "string" ? def.attribute : propName;
}

interface ReactiveValue<T = unknown> {
  readonly value: T;
}

function isReactiveValue(value: unknown): value is ReactiveValue {
  const isNode = typeof Node !== "undefined" && value instanceof Node;
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as Record<string, unknown>).value !== "undefined" &&
    !isNode
  );
}

function isEventHandlerKey(key: string): boolean {
  return (
    key.startsWith("on") && key.length > 2 && key[2] === key[2].toUpperCase()
  );
}

function getEventType(key: string): string {
  return key.slice(2).toLowerCase();
}

function isIslandsDirectiveProp(
  key: string,
): key is keyof IslandsDirectiveJSXProps {
  return (
    key === "client:load" ||
    key === "client:visible" ||
    key === "client:idle" ||
    key === "client:interaction" ||
    key === "client:media"
  );
}

function isKnownIslandStrategy(value: string | null): boolean {
  return value !== null && KNOWN_ISLAND_STRATEGIES.has(value);
}

function getColocatedClientStrategyFromShadowRoot(
  shadowRoot: ShadowRoot,
): { strategy: string; value: string | null } | null {
  const targets = Array.from(
    shadowRoot.querySelectorAll<HTMLElement>("[data-dh-client-strategy]"),
  );

  if (targets.length === 0) {
    return null;
  }

  let strategy: string | null = null;

  for (const target of targets) {
    const nextStrategy = target.getAttribute("data-dh-client-strategy");
    if (nextStrategy === null) {
      continue;
    }

    if (strategy === null) {
      strategy = nextStrategy;
      continue;
    }

    if (strategy !== nextStrategy) {
      throw new Error(
        "[dathomir] Mixed colocated client strategies are not supported in one component shadow root",
      );
    }
  }

  if (!isKnownIslandStrategy(strategy)) {
    return null;
  }

  return {
    strategy,
    value: strategy === "interaction" ? "click" : null,
  };
}

function createClientContext(host: HTMLElement): ComponentClientContext {
  const strategy = host.getAttribute("data-dh-island");
  const normalizedStrategy = isKnownIslandStrategy(strategy) ? strategy : null;
  return {
    strategy: normalizedStrategy,
    value:
      normalizedStrategy === null
        ? null
        : host.getAttribute("data-dh-island-value"),
    hydrated:
      (host as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_STATUS] ===
      "hydrated",
  };
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

function replayHydrationTrigger(
  shadowRoot: ShadowRoot,
  trigger: IslandHydrationTrigger | undefined,
): void {
  if (trigger?.eventType !== "click" || trigger.replayTargetId == null) {
    return;
  }

  const target = shadowRoot.querySelector<HTMLElement>(
    `[data-dh-client-target="${trigger.replayTargetId}"]`,
  );

  if (target === null) {
    return;
  }

  target.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      composed: true,
    }),
  );
}

function isIterableValue(value: unknown): value is Iterable<unknown> {
  const isNode = typeof Node !== "undefined" && value instanceof Node;
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.iterator in value &&
    !isNode
  );
}

function hasDynamicJSXChildren(value: unknown): boolean {
  if (typeof value === "function" || isReactiveValue(value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasDynamicJSXChildren(item));
  }

  if (isIterableValue(value)) {
    for (const item of value) {
      if (hasDynamicJSXChildren(item)) {
        return true;
      }
    }
  }

  return false;
}

function resolveJSXChildren(value: unknown): unknown {
  if (typeof value === "function") {
    return resolveJSXChildren((value as () => unknown)());
  }

  if (isReactiveValue(value)) {
    return resolveJSXChildren(value.value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveJSXChildren(item));
  }

  if (isIterableValue(value)) {
    return Array.from(value, (item) => resolveJSXChildren(item));
  }

  return value;
}

function applyJSXValue<S extends PropsSchema>(
  element: HTMLElement,
  key: string,
  value: unknown,
  propsSchema?: S,
): void {
  if (propsSchema && key in propsSchema) {
    (element as unknown as Record<string, unknown>)[key] = value;
    return;
  }

  const attrKey = key === "className" ? "class" : key;
  setAttr(element, attrKey, value);
}

function propsToSSRAttributes<S extends PropsSchema>(
  props: JSXComponentProps<S>,
  propsSchema?: S,
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(props)) {
    if (
      key === "children" ||
      isEventHandlerKey(key) ||
      isIslandsDirectiveProp(key)
    ) {
      continue;
    }

    const value = isReactiveValue(rawValue) ? rawValue.value : rawValue;
    if (value === null || value === undefined || value === false) {
      continue;
    }

    if (propsSchema && key in propsSchema) {
      const def = propsSchema[key]!;
      const attrName = attrNameForProp(key, def);
      if (attrName === null) {
        continue;
      }
      if (def.type === Boolean) {
        if (value) {
          attrs[attrName] = true;
        }
        continue;
      }
      attrs[attrName] = value;
      continue;
    }

    const attrKey = key === "className" ? "class" : key;
    attrs[attrKey] = value;
  }

  return attrs;
}

function createJSXComponent<S extends PropsSchema>(
  tagName: string,
  propsSchema?: S,
): JSXComponent<S> {
  return (props: JSXComponentProps<S> | null) => {
    const safeProps = props ?? ({} as JSXComponentProps<S>);

    if (typeof window === "undefined") {
      return renderDSD(
        tagName,
        propsToSSRAttributes(safeProps, propsSchema),
      ) as unknown as Node;
    }

    const element = document.createElement(tagName) as HTMLElement;

    for (const [key, value] of Object.entries(safeProps)) {
      if (key === "children" || isIslandsDirectiveProp(key)) {
        continue;
      }

      if (isEventHandlerKey(key) && typeof value === "function") {
        element.addEventListener(getEventType(key), value as EventListener);
        continue;
      }

      if (isReactiveValue(value)) {
        templateEffect(() => {
          applyJSXValue(element, key, value.value, propsSchema);
        });
        continue;
      }

      applyJSXValue(element, key, value, propsSchema);
    }

    const children = safeProps.children;
    if (children !== undefined) {
      if (hasDynamicJSXChildren(children)) {
        const anchor = document.createComment("component-children");
        element.append(anchor);
        templateEffect(() => {
          insert(element, resolveJSXChildren(children), anchor);
          bindCurrentStoreToSubtree(element);
        });
      } else {
        insert(element, children, null);
        bindCurrentStoreToSubtree(element);
      }
    }

    bindCurrentStoreToSubtree(element);

    return element;
  };
}

function createDefinedComponent<S extends PropsSchema>(
  webComponent: ComponentConstructor<S>,
  jsx: JSXComponent<S>,
  propsSchema: S | undefined,
  tagName: string,
): DefinedComponent<S> {
  const definedComponent = jsx as DefinedComponent<S>;
  Object.defineProperties(definedComponent, {
    webComponent: {
      value: webComponent,
      enumerable: true,
    },
    jsx: {
      value: jsx,
      enumerable: true,
    },
    __tagName__: {
      value: tagName,
      enumerable: true,
    },
    __propsSchema__: {
      value: propsSchema,
      enumerable: true,
    },
  });
  return definedComponent;
}

// ── Main API ────────────────────────────────────────────────────────

/**
 * Wrap a function component into a SetupFunction.
 * Passes reactive signal props directly to the function component.
 * @internal
 */
function wrapFunctionComponent<S extends PropsSchema>(
  fc: FunctionComponent<S>,
  _propsSchema: S | undefined,
): SetupFunction<S> {
  return (_host: HTMLElement, ctx: ComponentContext<S>) => {
    return fc(ctx);
  };
}

/**
 * Define a custom element with automatic Shadow DOM, reactive props with
 * type coercion, adoptedStyleSheets, and lifecycle management.
 * Accepts a FunctionComponent that receives reactive prop signals.
 * @param tagName - Custom element tag name (must contain a hyphen).
 * @param component - Function component that creates the component's DOM content.
 * @param options - Optional configuration for styles, props, and hydration.
 * @returns A component definition object containing the custom element class and JSX helper.
 */
function defineComponent<const S extends PropsSchema = Record<string, never>>(
  tagName: string,
  component: FunctionComponent<S>,
  options: ComponentOptions<S> = {},
): DefinedComponent<S> {
  const isSSR = typeof window === "undefined";
  const jsx = createJSXComponent(tagName, options.props);

  // Wrap function component into SetupFunction
  const resolvedSetup: SetupFunction<S> = wrapFunctionComponent(
    component,
    options.props,
  );

  if (isSSR) {
    const cssTexts: string[] = [];
    if (options.styles?.length) {
      for (const s of options.styles) {
        const text = getCssText(s);
        if (text) cssTexts.push(text);
      }
    }
    registerComponent(
      tagName,
      resolvedSetup as SetupFunction,
      cssTexts,
      options.props as PropsSchema | undefined,
    );
    ensureComponentRenderer();
    const SSRClass = class {} as any;
    SSRClass.__tagName__ = tagName;
    SSRClass.__propsSchema__ = options.props;
    return createDefinedComponent(SSRClass, jsx, options.props, tagName);
  }

  const { styles, props: propsSchema, hydrate: hydrateSetup } = options;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    if (!tagName.includes("-")) {
      console.warn(
        `[dathomir] Custom element tag name "${tagName}" must contain a hyphen.`,
      );
    }
  }

  // Pre-process styles
  let sheets: CSSStyleSheet[] | undefined;
  if (styles?.length) {
    sheets = styles.map((s) => {
      if (typeof s === "string") {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(s);
        return sheet;
      }
      return s;
    });
  }

  // Build attr→prop mapping from schema
  const attrToProp = new Map<string, string>();
  const observedAttrNames: string[] = [];
  if (propsSchema) {
    for (const propName of Object.keys(propsSchema)) {
      const attrName = attrNameForProp(propName, propsSchema[propName]!);
      if (attrName !== null) {
        attrToProp.set(attrName, propName);
        observedAttrNames.push(attrName);
      }
    }
  }

  // WeakMap to store prop signals (accessible from property descriptors)
  const propSignalMap = new WeakMap<
    HTMLElement,
    Record<string, Signal<unknown>>
  >();

  class Component extends HTMLElement {
    static observedAttributes = observedAttrNames;
    #dispose: RootDispose | undefined;
    #islandHydrationAccepted = false;
    #storeRetryScheduled = false;

    constructor() {
      super();
      captureCurrentStore(this);

      // Shadow DOM setup
      if (!this.shadowRoot) {
        const template = this.querySelector(
          ":scope > template[shadowrootmode]",
        ) as HTMLTemplateElement | null;
        if (template) {
          const shadow = this.attachShadow({ mode: "open" });
          shadow.appendChild(template.content);
          template.remove();
        } else {
          this.attachShadow({ mode: "open" });
        }
      }
      // Create prop signals with type coercion
      if (propsSchema) {
        const signals: Record<string, Signal<unknown>> = {};
        for (const propName of Object.keys(propsSchema)) {
          const def = propsSchema[propName]!;
          const attrName = attrNameForProp(propName, def);
          const rawAttr =
            attrName !== null ? this.getAttribute(attrName) : null;
          const initialValue =
            attrName !== null
              ? coerceValue(def, rawAttr)
              : getDefaultValue(def);
          signals[propName] = signal(initialValue);
        }
        propSignalMap.set(this, signals);
      }
    }

    connectedCallback(): void {
      const propSignals = propSignalMap.get(this) ?? {};
      const shadowRoot = this.shadowRoot!;
      const hasDSD = shadowRoot.childNodes.length > 0;
      let colocatedStrategy = hasDSD
        ? getColocatedClientStrategyFromShadowRoot(shadowRoot)
        : null;

      const hasHostIslandMetadata = this.getAttribute("data-dh-island") !== null;

      if (colocatedStrategy !== null && hydrateSetup !== undefined) {
        console.error(
          "[dathomir] colocated load:onClick / interaction:onClick / idle:onClick / visible:onClick cannot be combined with a hydrate option in the same component",
        );
        colocatedStrategy = null;
      }

      if (colocatedStrategy !== null && hasHostIslandMetadata) {
        console.error(
          "[dathomir] host-level client:* directives or data-dh-island metadata cannot be combined with colocated client directives in the same component render subtree",
        );
        colocatedStrategy = null;
      }

      if (
        colocatedStrategy !== null &&
        this.getAttribute("data-dh-island") === null
      ) {
        this.setAttribute("data-dh-island", colocatedStrategy.strategy);
        if (colocatedStrategy.value !== null) {
          this.setAttribute("data-dh-island-value", colocatedStrategy.value);
        }
      }

      const ctx = {
        host: this,
        props: propSignals,
        get client() {
          return createClientContext(this.host);
        },
        get store() {
          return getStoreFromHost(this.host);
        },
      } as ComponentContext<S>;
      const islandStrategy = this.getAttribute("data-dh-island");
      const shouldDeferIslandHydration =
        hasDSD &&
        (hydrateSetup !== undefined || colocatedStrategy !== null) &&
        isKnownIslandStrategy(islandStrategy);

      this.#islandHydrationAccepted = false;
      (this as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_HOOK] = undefined;
      (this as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_STATUS] =
        undefined;
      connectGlobalStyles(shadowRoot, sheets ?? []);

      const retryIfStoreEventuallyBinds = (run: () => void): boolean => {
        if (
          peekStoreFromHost(this) !== undefined ||
          this.#storeRetryScheduled
        ) {
          return false;
        }

        this.#storeRetryScheduled = true;
        queueMicrotask(() => {
          this.#storeRetryScheduled = false;
          if (!this.isConnected || peekStoreFromHost(this) === undefined) {
            return;
          }

          run();
        });
        return true;
      };

      const isMissingStoreError = (error: unknown): boolean => {
        return (
          error instanceof Error &&
          error.message === "[dathomir] No store bound to component host"
        );
      };

      const runHydrate = (): boolean => {
        try {
          this.#dispose = createRoot(() => {
            hydrateSetup!(ctx);
          });
          this.#islandHydrationAccepted = true;
          if (isKnownIslandStrategy(this.getAttribute("data-dh-island"))) {
            (this as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_STATUS] =
              "hydrated";
          }
          return true;
        } catch (error) {
          if (
            isMissingStoreError(error) &&
            retryIfStoreEventuallyBinds(runHydrate)
          ) {
            return false;
          }
          console.error("[dathomir] Error in component hydrate:", error);
          return false;
        }
      };

      const runSetup = (trigger?: IslandHydrationTrigger): boolean => {
        try {
          this.#dispose = createRoot(() => {
            if (hasDSD) {
              shadowRoot.innerHTML = "";
            }
            const content = resolvedSetup(this, ctx);
            shadowRoot.append(content as string | Node);
            replayHydrationTrigger(shadowRoot, trigger);
          });
          this.#islandHydrationAccepted = true;
          if (isKnownIslandStrategy(this.getAttribute("data-dh-island"))) {
            (this as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_STATUS] =
              "hydrated";
          }
          return true;
        } catch (error) {
          if (
            isMissingStoreError(error) &&
            retryIfStoreEventuallyBinds(() => {
              runSetup(trigger);
            })
          ) {
            return false;
          }
          console.error("[dathomir] Error in component setup:", error);
          return false;
        }
      };

      if (hasDSD) {
        if (this.shadowRoot!.adoptedStyleSheets.length > 0) {
          const dsdStyles = shadowRoot.querySelectorAll("style");
          for (const style of dsdStyles) {
            style.remove();
          }
        }

        if (shouldDeferIslandHydration) {
          (this as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_STATUS] =
            "idle";
          (this as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_HOOK] = (
            trigger?: IslandHydrationTrigger,
          ) => {
            if (!this.isConnected || this.#islandHydrationAccepted) {
              return false;
            }

            (this as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_STATUS] =
              "hydrated";
            const didHydrate =
              hydrateSetup !== undefined ? runHydrate() : runSetup(trigger);
            if (didHydrate) {
              (this as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_STATUS] =
                "hydrated";
            } else {
              (this as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_STATUS] =
                "idle";
            }
            return didHydrate;
          };
        } else if (hydrateSetup) {
          runHydrate();
        } else {
          runSetup();
        }
      } else {
        runSetup();
      }
    }

    disconnectedCallback(): void {
      cancelScheduledIslandHydration(this);
      this.#dispose?.();
      this.#dispose = undefined;
      this.#islandHydrationAccepted = false;
      (this as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_HOOK] = undefined;
      (this as Record<PropertyKey, unknown>)[HYDRATE_ISLANDS_STATUS] =
        undefined;
      disconnectGlobalStyles(this.shadowRoot!);
    }

    attributeChangedCallback(
      name: string,
      _oldValue: string | null,
      newValue: string | null,
    ): void {
      const propName = attrToProp.get(name);
      if (!propName || !propsSchema) return;
      const def = propsSchema[propName]!;
      const propSignals = propSignalMap.get(this);
      const sig = propSignals?.[propName];
      if (sig) {
        try {
          sig.set(coerceValue(def, newValue) as never);
        } catch (error) {
          console.error("[dathomir] Error updating prop signal:", error);
        }
      }
    }
  }

  // Define JS property getters/setters on the element prototype
  if (propsSchema) {
    for (const propName of Object.keys(propsSchema)) {
      Object.defineProperty(Component.prototype, propName, {
        get(this: HTMLElement) {
          return propSignalMap.get(this)?.[propName]?.value;
        },
        set(this: HTMLElement, newValue: unknown) {
          propSignalMap.get(this)?.[propName]?.set(newValue as never);
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  customElements.define(tagName, Component);

  (Component as any).__tagName__ = tagName;
  (Component as any).__propsSchema__ = propsSchema;

  return createDefinedComponent(
    Component as unknown as ComponentConstructor<S>,
    jsx,
    propsSchema,
    tagName,
  );
}

export { defineComponent };
export type {
  ComponentClass,
  ComponentClientContext,
  ComponentConstructor,
  ComponentContext,
  ComponentElement,
  ComponentMetadata,
  ComponentOptions,
  DefinedComponent,
  FunctionComponent,
  HydrateSetupFunction,
  InferProps,
  InferPropType,
  JSXComponent,
  JSXComponentProps,
  JSXPropValue,
  JSXReactiveValue,
  IslandsDirectiveJSXProps,
  PropDefinition,
  PropsSchema,
  PropType,
  SetupFunction,
};
