import type { JSX as CoreJSX } from "@dathomir/core/jsx-runtime";

declare global {
  namespace JSX {
    interface IntrinsicElements extends CoreJSX.IntrinsicElements {
      "dathomir-ssr-store-counter": Record<string, unknown>;
    }
  }
}

declare module "@dathomir/core/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "dathomir-ssr-store-counter": Record<string, unknown>;
    }
  }
}

export {};
