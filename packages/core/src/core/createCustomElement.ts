import { PropsDictionary } from "./Props";
import { jsx } from "@dathomir/runtime/jsx-runtime";
import { computed, Computed, Signal, signal } from "@dathomir/reactivity";
import { CamelCase, pascalCase } from "@dathomir/shared";

type SignaledProps<P extends PropsDictionary> = {
  [K in keyof P]: Signal<P[K]["__props_type__"] | undefined>;
};

type CreateCustomElementParams<
  Emits extends Record<string, (event: CustomEventInit<any>) => any>,
  TagName extends `${string}-${string}`,
  Props extends PropsDictionary
> = {
  tagName: TagName;
  props: Props;
  emits?: Emits;
  render: ({
    onConnected,
    onDisconnected,
  }: {
    onConnected: (callback: () => Promise<void> | void) => void;
    onDisconnected: (callback: () => Promise<void> | void) => void;
    onConnectedMove: (callback: () => Promise<void> | void) => void;
    onAdopted: (callback: () => Promise<void> | void) => void;
    onServerLoading: (callback: () => Promise<void> | void) => void;
    defineShadow: (callback: () => ShadowRootInit) => void;
    props: SignaledProps<Props>;
    emit: <K extends keyof Emits>(
      eventName: K,
      detail: ReturnType<Emits[K]>
    ) => void;
  }) => Node;
};

const createCustomElement = <
  const Emits extends Record<string, (event: CustomEventInit<any>) => any>,
  const TagName extends `${string}-${string}`,
  const Props extends PropsDictionary
>({
  tagName,
  props,
  emits: _emits,
  render,
}: CreateCustomElementParams<Emits, TagName, Props>) => {
  class CustomElement extends HTMLElement {
    #onConnectedFunctions: Array<() => Promise<void> | void> = [];
    #onDisconnectedFunctions: Array<() => Promise<void> | void> = [];
    #onConnectedMoveFunctions: Array<() => Promise<void> | void> = [];
    #onAdoptedFunctions: Array<() => Promise<void> | void> = [];
    #defineShadow: (() => ShadowRootInit) | undefined = undefined;
    #renderNoShadow: () => void = () => {};
    static observedAttributes = Object.keys(props);
    #props!: SignaledProps<Props>;

    static readonly __props_type__ = "" as unknown as {
      [K in keyof Props]: Props[K]["__props_type__"] | undefined;
    } & {
      [K in keyof Emits as CamelCase<`on-${K & string}`>]?: (
        event: ReturnType<Emits[K]>
      ) => void;
    };

    constructor() {
      super();

      // Initialize signals per key; attribute value (string) is assigned raw for now.
      this.#props = {} as SignaledProps<Props>;
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
        onConnectedMove: (callback) => {
          this.#onConnectedMoveFunctions.push(callback);
        },
        defineShadow: (callback) => {
          this.#defineShadow = callback;
        },
        onServerLoading: () => {},
        props: this.#props,
        emit: (eventName, detail) => {
          if (typeof eventName !== "string") {
            throw Error("Event name must be a string");
          }

          const event = new CustomEvent(eventName, {
            bubbles: true,
            composed: true,
            ...detail,
          });

          this.dispatchEvent(event);
        },
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

    async connectedMoveCallback() {
      await Promise.all(this.#onConnectedMoveFunctions.map((fn) => fn()));
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

  const customElementName = pascalCase(`${tagName}-element`);
  const CustomElementComponentName = pascalCase(tagName);
  const CustomElementComponent = computed(
    () =>
      (
        props: {
          [K in keyof Props]:
            | Signal<Props[K]["__props_type__"]>
            | Computed<Props[K]["__props_type__"]>
            | Props[K]["__props_type__"];
        } & {
          [K in keyof Emits as CamelCase<`on-${K & string}`>]?: (
            event: ReturnType<Emits[K]>
          ) => void;
        }
      ) => {
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

  return value as Record<typeof customElementName, typeof CustomElement> &
    Record<typeof CustomElementComponentName, typeof CustomElementComponent>;
};

export { createCustomElement };
