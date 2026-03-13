declare global {
  namespace JSX {
    interface IntrinsicElements
      extends import("@dathomir/core/jsx-runtime").JSX.IntrinsicElements {}
  }
}

export {};
