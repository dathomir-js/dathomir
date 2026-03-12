import { getCurrentStore, withStore } from "@dathomir/core";

import type { DemoTheme } from "./demoStore";
import {
  countAtom,
  createDemoStore,
  themeAtom,
} from "./demoStore";
import "./WebComponentSSR";

const themeOrder: readonly DemoTheme[] = ["light", "mint", "amber", "night"];

function requireCurrentStore() {
  const store = getCurrentStore();
  if (store === undefined) {
    throw new Error("[playground/ssr] missing store boundary");
  }
  return store;
}

function nextTheme(currentTheme: DemoTheme): DemoTheme {
  const currentIndex = themeOrder.indexOf(currentTheme);
  return themeOrder[(currentIndex + 1) % themeOrder.length] ?? themeOrder[0];
}

function ScopeCard(props: {
  title: string;
  description: string;
  expectation: string;
}) {
  const store = requireCurrentStore();
  const count = store.ref(countAtom);
  const theme = store.ref(themeAtom);

  return (
    <article>
      <h3>{props.title}</h3>
      <p>{props.description}</p>
      <p>Expected: {props.expectation}</p>
      <p>Store appId: <strong>{store.appId}</strong></p>
      <p>countAtom: <strong>{count.value}</strong></p>
      <p>themeAtom: <strong>{theme.value}</strong></p>
      <button onClick={() => count.set((value) => value + 1)}>
        countAtom++
      </button>
      <button onClick={() => theme.set(nextTheme(theme.peek()))}>
        cycle themeAtom
      </button>
    </article>
  );
}

function App() {
  const isolatedLeftStore = createDemoStore({
    appId: "playground-ssr-isolated-left",
    count: 10,
    theme: "amber",
  });
  const isolatedRightStore = createDemoStore({
    appId: "playground-ssr-isolated-right",
    count: 40,
    theme: "night",
  });
  const rootStore = requireCurrentStore();

  return (
    <main>
      <h1>Dathomir SSR Playground</h1>
      <p>Sibling withStore boundaries can either share or isolate atom values.</p>
      <p>
        Current render mode: {typeof document === "undefined" ? "SSR" : "CSR"}
      </p>

      <section>
        <h2>Shared siblings</h2>
        <p>Both siblings use the same store instance, so updates propagate both ways.</p>
        {withStore(rootStore, () => (
          <ScopeCard
            title="Shared A"
            description="Sibling A uses the root store boundary."
            expectation="Incrementing here updates Shared B as well."
          />
        ))}
        {withStore(rootStore, () => (
          <ScopeCard
            title="Shared B"
            description="Sibling B also uses the root store boundary."
            expectation="Theme and count stay in sync with Shared A."
          />
        ))}
      </section>

      <section>
        <h2>Isolated siblings</h2>
        <p>Each sibling gets its own createAtomStore(), so updates stay local.</p>
        {withStore(isolatedLeftStore, () => (
          <ScopeCard
            title="Isolated A"
            description="Sibling A uses its own store instance."
            expectation="Incrementing here does not affect Isolated B."
          />
        ))}
        {withStore(isolatedRightStore, () => (
          <ScopeCard
            title="Isolated B"
            description="Sibling B uses a different store instance."
            expectation="Theme and count stay independent from Isolated A."
          />
        ))}
      </section>

      <section>
        <h2>Custom element under the root boundary</h2>
        <p>This counter reads ctx.store, so it follows the active withStore boundary too.</p>
        <dathomir-ssr-store-counter />
      </section>
    </main>
  );
}

export { App };
export default App;
