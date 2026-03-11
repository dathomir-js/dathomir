import { effect, withStore } from "@dathomir/core";

import {
  countAtom,
  createDemoStore
} from "./demoStore";
import "./WebComponentSSR";

export function App() {
  const store = createDemoStore();
  const count = store.ref(countAtom);

  setInterval(() => {
    store.set(countAtom, (c) => c + 1);
  }, 1000);

  effect(() => {
    if (count.value % 5 === 0) {
      console.log("Count is a multiple of 5:", count.value);
    }
  });

  return (
    <main>
      <h1>Dathomir SSR Playground</h1>
      <p>Minimal demo for SSR, Web Components, and a scoped atom store.</p>
      <p data-render-mode={typeof document === "undefined" ? "SSR" : "CSR"}>
        Current render mode: {typeof document === "undefined" ? "SSR" : "CSR"}
      </p>
      <p>
        Store value : <strong>{count.value}</strong>
      </p>
      {withStore(store, () => <dathomir-ssr-store-counter></dathomir-ssr-store-counter>)}
    </main>
  );
}

export default App;
