/**
 * defineComponent - High-level API for defining Web Components.
 *
 * Automates: Shadow DOM setup, createRoot lifecycle, DSD hydration detection,
 * adoptedStyleSheets, and props reflection with reactive signals and type coercion.
 * @module
 */
import { getCssText } from "@/css/implementation";
import { registerComponent } from "@/registry/implementation";
import { ensureComponentRenderer } from "@/ssr/implementation";
import type { RootDispose, Signal } from "@dathomir/reactivity";
import { createRoot, signal } from "@dathomir/reactivity";

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
type InferPropType<D extends PropDefinition> =
  D extends { type: StringConstructor } ? string :
  D extends { type: NumberConstructor } ? number :
  D extends { type: BooleanConstructor } ? boolean :
  D extends { type: (v: string | null) => infer R } ? R :
  unknown;

/** Map a PropsSchema to an object of reactive signals. */
type InferProps<S extends PropsSchema> = {
  readonly [K in keyof S]: Signal<InferPropType<S[K]>>;
};

/**
 * Function component that receives reactive props as signals.
 * Props can be accessed via .value and will reactively update when attributes change.
 */
type FunctionComponent<S extends PropsSchema = PropsSchema> = (
  props: InferProps<S>,
) => Node | DocumentFragment | string;

/** Internal setup function with host and context. @internal */
type SetupFunction<S extends PropsSchema = PropsSchema> = (
  host: HTMLElement,
  ctx: ComponentContext<S>,
) => Node | DocumentFragment | string;

/** Context passed to setup and hydrate functions. */
interface ComponentContext<S extends PropsSchema = PropsSchema> {
  readonly props: Readonly<InferProps<S>>;
}

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
interface ComponentClass<S extends PropsSchema = PropsSchema> extends Function {
  readonly __tagName__: string;
  readonly __propsSchema__?: S;
}

/** Constructor type returned by defineComponent. */
type ComponentConstructor<S extends PropsSchema = PropsSchema> = {
  new(): HTMLElement & { [K in keyof S]: InferPropType<S[K]> };
  readonly prototype: HTMLElement;
} & ComponentClass<S>;

/** TSX helper: derive element attribute types from a ComponentClass. */
type ComponentElement<C> =
  C extends ComponentClass<infer S>
    ? { [K in keyof S]?: InferPropType<S[K]> } & { children?: unknown }
    : Record<string, unknown>;

/** Function that hydrates existing DSD content without creating new DOM. */
type HydrateSetupFunction<S extends PropsSchema = PropsSchema> = (
  host: HTMLElement,
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
  if (def.type === Number) return Number(attrValue);
  if (def.type === String) return attrValue;
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
    return fc(ctx.props);
  };
}

/**
 * Define a custom element with automatic Shadow DOM, reactive props with
 * type coercion, adoptedStyleSheets, and lifecycle management.
 * Accepts a FunctionComponent that receives plain prop values.
 * @param tagName - Custom element tag name (must contain a hyphen).
 * @param component - Function component that creates the component's DOM content.
 * @param options - Optional configuration for styles, props, and hydration.
 * @returns The registered HTMLElement class with __tagName__ and __propsSchema__ properties.
 */
function defineComponent<const S extends PropsSchema = Record<string, never>>(
  tagName: string,
  component: FunctionComponent<S>,
  options: ComponentOptions<S> = {},
): ComponentConstructor<S> {
  const isSSR = typeof window === "undefined";

  // Wrap function component into SetupFunction
  const resolvedSetup: SetupFunction<S> = wrapFunctionComponent(component, options.props);

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
    return SSRClass;
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
  const propSignalMap = new WeakMap<HTMLElement, Record<string, Signal<unknown>>>();

  class Component extends HTMLElement {
    static observedAttributes = observedAttrNames;
    #dispose: RootDispose | undefined;

    constructor() {
      super();

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
      if (sheets) {
        this.shadowRoot!.adoptedStyleSheets = sheets;
      }

      // Create prop signals with type coercion
      if (propsSchema) {
        const signals: Record<string, Signal<unknown>> = {};
        for (const propName of Object.keys(propsSchema)) {
          const def = propsSchema[propName]!;
          const attrName = attrNameForProp(propName, def);
          const rawAttr = attrName !== null ? this.getAttribute(attrName) : null;
          const initialValue = rawAttr !== null
            ? coerceValue(def, rawAttr)
            : getDefaultValue(def);
          signals[propName] = signal(initialValue);
        }
        propSignalMap.set(this, signals);
      }
    }

    connectedCallback(): void {
      const propSignals = propSignalMap.get(this) ?? {};
      const ctx = { props: propSignals } as ComponentContext<S>;
      const shadowRoot = this.shadowRoot!;
      const hasDSD = shadowRoot.childNodes.length > 0;

      if (hasDSD) {
        if (sheets) {
          const dsdStyles = shadowRoot.querySelectorAll("style");
          for (const style of dsdStyles) {
            style.remove();
          }
        }

        if (hydrateSetup) {
          this.#dispose = createRoot(() => {
            hydrateSetup(this, ctx);
          });
        } else {
          this.#dispose = createRoot(() => {
            shadowRoot.innerHTML = "";
            const content = resolvedSetup(this, ctx);
            shadowRoot.append(content as string | Node);
          });
        }
      } else {
        this.#dispose = createRoot(() => {
          const content = resolvedSetup(this, ctx);
          shadowRoot.append(content as string | Node);
        });
      }
    }

    disconnectedCallback(): void {
      this.#dispose?.();
      this.#dispose = undefined;
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
        sig.set(coerceValue(def, newValue) as never);
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

  return Component as unknown as ComponentConstructor<S>;
}

export { defineComponent };
export type {
  ComponentClass,
  ComponentConstructor,
  ComponentContext,
  ComponentElement,
  ComponentOptions,
  FunctionComponent,
  HydrateSetupFunction, InferProps, InferPropType, PropDefinition, PropsSchema, PropType, SetupFunction
};

