/**
 * defineComponent - High-level API for defining Web Components.
 *
 * Automates: Shadow DOM setup, createRoot lifecycle, DSD hydration detection,
 * adoptedStyleSheets, and attribute reflection with reactive signals.
 * @module
 */
import { getCssText } from "@/css/implementation";
import { registerComponent } from "@/registry/implementation";
import { ensureComponentRenderer } from "@/ssr/implementation";
import type { RootDispose, Signal } from "@dathomir/reactivity";
import { createRoot, signal } from "@dathomir/reactivity";

/** Function that builds the component's DOM content. */
type SetupFunction = (
  host: HTMLElement,
  ctx: ComponentContext,
) => Node | DocumentFragment | string;

/** Context passed to setup and hydrate functions. */
interface ComponentContext {
  readonly attrs: Readonly<Record<string, Signal<string | null>>>;
}

/** Options for defineComponent. */
interface ComponentOptions {
  /** CSS styles to apply via adoptedStyleSheets. */
  styles?: readonly (CSSStyleSheet | string)[];
  /** Attribute names to observe and reflect as reactive signals. */
  attrs?: readonly string[];
  /** Hydration setup function for Declarative Shadow DOM. */
  hydrate?: HydrateSetupFunction;
}

/** Component class with tag name metadata. */
interface ComponentClass extends Function {
  readonly __tagName__: string;
}

/** Function that hydrates existing DSD content without creating new DOM. */
type HydrateSetupFunction = (
  host: HTMLElement,
  ctx: ComponentContext,
) => void;

/**
 * Define a custom element with automatic Shadow DOM, reactive attributes,
 * adoptedStyleSheets, and lifecycle management.
 * @param tagName - Custom element tag name (must contain a hyphen).
 * @param setup - Function that creates the component's DOM content.
 * @param options - Optional configuration for styles, attributes, and hydration.
 * @returns The registered HTMLElement class with __tagName__ property.
 */
function defineComponent(
  tagName: string,
  setup: SetupFunction,
  options: ComponentOptions = {},
): typeof HTMLElement & ComponentClass {
  // SSR environment check
  const isSSR = typeof window === "undefined";

  // In SSR, register the component for DSD output and return a placeholder class
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
      setup,
      cssTexts,
      options.attrs ?? [],
    );
    ensureComponentRenderer();
    const SSRClass = class {} as any;
    SSRClass.__tagName__ = tagName;
    return SSRClass;
  }

  const { styles, attrs: observedAttrNames, hydrate: hydrateSetup } = options;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    if (!tagName.includes("-")) {
      console.warn(
        `[dathomir] Custom element tag name "${tagName}" must contain a hyphen.`,
      );
    }
  }

  // Pre-process styles: convert strings to CSSStyleSheet
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

  class Component extends HTMLElement {
    static observedAttributes = observedAttrNames ?? [];
    #dispose: RootDispose | undefined;
    #attrSignals: Record<string, Signal<string | null>> = {};

    constructor() {
      super();
      if (!this.shadowRoot) {
        // Check for DSD fallback: <template shadowrootmode="open"> not parsed
        const template = this.querySelector(
          ":scope > template[shadowrootmode]",
        ) as HTMLTemplateElement | null;
        if (template) {
          // DSD non-supported browser: manually create ShadowRoot
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
      if (observedAttrNames) {
        for (const name of observedAttrNames) {
          this.#attrSignals[name] = signal(this.getAttribute(name));
        }
      }
    }

    connectedCallback(): void {
      const ctx: ComponentContext = { attrs: this.#attrSignals };
      const shadowRoot = this.shadowRoot!;
      const hasDSD = shadowRoot.childNodes.length > 0;

      if (hasDSD) {
        // Remove DSD <style> tags (replaced by adoptedStyleSheets)
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
          // DSD content exists but no hydrate function:
          // Re-render with setup (replaces DSD content)
          this.#dispose = createRoot(() => {
            shadowRoot.innerHTML = "";
            const content = setup(this, ctx);
            shadowRoot.append(content);
          });
        }
      } else {
        this.#dispose = createRoot(() => {
          const content = setup(this, ctx);
          shadowRoot.append(content);
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
      const sig = this.#attrSignals[name];
      if (sig) {
        sig.value = newValue;
      }
    }
  }

  customElements.define(tagName, Component);

  // Add static tag name metadata
  (Component as any).__tagName__ = tagName;

  return Component as unknown as typeof HTMLElement & ComponentClass;
}

export { defineComponent };
export type {
  ComponentClass,
  ComponentContext,
  ComponentOptions,
  HydrateSetupFunction,
  SetupFunction
};

