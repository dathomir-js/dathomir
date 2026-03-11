import { withStore } from "@dathomir/core";

import { createDemoStore } from "./demoStore";
import "./WebComponentSSR";

export function App() {
  const store = createDemoStore("playground-ssr");

  return (
    <main>
      <h1>Dathomir SSR Playground</h1>
      <p>Minimal demo for SSR, Web Components, and a scoped atom store.</p>
      <p data-render-mode={typeof document === "undefined" ? "SSR" : "CSR"}>
        Current render mode: {typeof document === "undefined" ? "SSR" : "CSR"}
      </p>
      {withStore(store, () => <dathomir-ssr-store-counter></dathomir-ssr-store-counter>)}
    </main>
  );
}

export default App;
