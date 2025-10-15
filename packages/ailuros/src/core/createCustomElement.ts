import { toPascalCase } from "@/utils/toPascalCase";
import { PropsDictionary } from "./Props";
import { computed } from "node_modules/@ailuros/reactivity/dist/index.cjs";
import { jsx } from "@ailuros/runtime/jsx-runtime";
import { Computed, Signal, signal } from "@ailuros/reactivity";

type PropsSignals<P extends PropsDictionary> = {
  [K in keyof P]: Signal<P[K]["__props_type__"] | undefined>;
};

type CreateCustomElementParams<
  T extends `${string}-${string}`,
  Props extends PropsDictionary
> = {
  tagName: T;
  props: Props;
  render: ({
    onConnected,
    onDisconnected,
  }: {
    onConnected: (callback: () => Promise<void> | void) => void;
    onDisconnected: (callback: () => Promise<void> | void) => void;
    onAdopted: (callback: () => Promise<void> | void) => void;
    defineShadow: (callback: () => ShadowRootInit) => void;
    /**
     * Reactive signals keyed by the original props definition.
     * Each key retains its literal/union type without collapsing into a global union.
     */
    props: PropsSignals<Props>;
  }) => Node;
};

const createCustomElement = <
  const T extends `${string}-${string}`,
  const Props extends PropsDictionary
>({
  tagName,
  props,
  render,
}: CreateCustomElementParams<T, Props>) => {
  class CustomElement extends HTMLElement {
    #onConnectedFunctions: Array<() => Promise<void> | void> = [];
    #onDisconnectedFunctions: Array<() => Promise<void> | void> = [];
    #onAdoptedFunctions: Array<() => Promise<void> | void> = [];
    #defineShadow: (() => ShadowRootInit) | undefined = undefined;
    #renderNoShadow: () => void = () => {};
    static observedAttributes = Object.keys(props);
    #props!: PropsSignals<Props>;

    static readonly __props_type__ = "" as unknown as {
      [K in keyof Props]: Props[K]["__props_type__"] | undefined;
    };

    constructor() {
      super();

      // Initialize signals per key; attribute value (string) is assigned raw for now.
      this.#props = {} as PropsSignals<Props>;
      for (const key in props) {
        const k = key as keyof Props;
        const attr = this.getAttribute(key) || "";
        this.#props[k] = signal<Props[typeof k]["__props_type__"] | undefined>(
          attr as any
        );
      }

      const element = render({
        onConnected: (callback) => {
          this.#onConnectedFunctions.push(callback);
        },
        onDisconnected: (callback) => {
          this.#onDisconnectedFunctions.push(callback);
        },
        onAdopted: (callback) => {
          this.#onAdoptedFunctions.push(callback);
        },
        defineShadow: (callback) => {
          this.#defineShadow = callback;
        },
        props: this.#props,
      });

      if (this.#defineShadow) {
        this.attachShadow(this.#defineShadow());
        this.shadowRoot!.appendChild(element);
      } else {
        this.#renderNoShadow = () => {
          this.appendChild(element);
        };
      }
    }

    async connectedCallback() {
      if (!this.#defineShadow) {
        this.#renderNoShadow();
      }

      await Promise.all(this.#onConnectedFunctions.map((fn) => fn()));
    }

    async disconnectedCallback() {
      await Promise.all(this.#onDisconnectedFunctions.map((fn) => fn()));
    }

    async adoptedCallback() {
      await Promise.all(this.#onAdoptedFunctions.map((fn) => fn()));
    }

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null
    ) {
      if (!(name in this.#props)) {
        return;
      }
      if (oldValue === newValue) {
        return;
      }

      const setValue = (() => {
        switch (props[name].type) {
          case "number":
            return newValue ? Number(newValue) : undefined;
          case "boolean":
            return newValue === "true"
              ? true
              : newValue === "false"
              ? false
              : undefined;
          case "string":
          case "union":
            return newValue ? newValue : undefined;
        }
      })();

      this.#props[name as keyof Props].set(() => setValue);
    }
  }

  const customElementName = toPascalCase(`${tagName}-element`);
  const CustomElementComponentName = toPascalCase(tagName);
  const CustomElementComponent = computed(
    () =>
      (props: {
        [K in keyof Props]:
          | Signal<Props[K]["__props_type__"]>
          | Computed<Props[K]["__props_type__"]>
          | Props[K]["__props_type__"];
      }) => {
        if (!customElements.get(tagName)) {
          customElements.define(tagName, CustomElement);
        }

        return jsx(tagName, props);
      }
  );

  const value = {
    [customElementName]: CustomElement,
    [CustomElementComponentName]: CustomElementComponent,
  } as Record<typeof customElementName, typeof CustomElement> &
    Record<typeof CustomElementComponentName, typeof CustomElementComponent>;

  return value;
};

export { createCustomElement };
