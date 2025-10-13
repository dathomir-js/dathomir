type CreateCustomElementParams<T extends `${string}-${string}`> = {
  tagName: T;
  props: Record<string, unknown>;
  render: ({
    onConnected,
    onDisconnected,
  }: {
    onConnected: (callback: () => Promise<void> | void) => void;
    onDisconnected: (callback: () => Promise<void> | void) => void;
    onAdopted: (callback: () => Promise<void> | void) => void;
    defineShadow: (callback: () => ShadowRootInit) => void;
  }) => Node;
};

/**
 * Converts a kebab-case string to PascalCase
 * @example
 * ToPascalCase<"my-custom-element"> => "MyCustomElement"
 */
type ToPascalCase<T extends string> = T extends `${infer First}-${infer Rest}`
  ? `${Capitalize<First>}${ToPascalCase<Rest>}`
  : Capitalize<T>;

const createCustomElement = <const T extends `${string}-${string}`>({
  tagName,
  props,
  render,
}: CreateCustomElementParams<T>) => {
  class CustomElement extends HTMLElement {
    #onConnectedFunctions: Array<() => Promise<void> | void> = [];
    #onDisconnectedFunctions: Array<() => Promise<void> | void> = [];
    #onAdoptedFunctions: Array<() => Promise<void> | void> = [];
    #defineShadow: (() => ShadowRootInit) | undefined = undefined;
    #renderNoShadow: () => void = () => {};

    constructor() {
      super();

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
  }

  const customElementName = `${tagName}-element`
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") as ToPascalCase<`${T}-element`>;

  const value = {
    [customElementName]: CustomElement,
  } as {
    [K in ToPascalCase<`${T}-element`>]: typeof CustomElement;
  };

  return value;
};

export { createCustomElement };
