export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "demo-counter-box": Record<string, unknown>;
    }
  }
}

declare module "@dathomir/core/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "demo-counter-box": Record<string, unknown>;
    }
  }
}
