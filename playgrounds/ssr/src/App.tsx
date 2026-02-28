/**
 * Main App component for SSR demonstration.
 */

import { signal } from "@dathomir/core";
import { Counter } from "./Counter";
import "./WebComponentSSR";

export function App() {
  const counter = signal(0);

  setInterval(() => {
    counter.set((v) => v + 1);
  }, 1000);

  return (
    <main>
      <h1>Dathomir SSR Playground</h1>
      <p>{typeof window === "undefined" ? "Server" : <h1>Client</h1>}</p>
      <p>This page demonstrates Server-Side Rendering and Hydration.</p>
      <Counter initialCount={counter.value} />

      <hr style="margin: 40px 0; border: 1px solid #ddd;" />

      <h2>Web Components with Declarative Shadow DOM</h2>
      <dathomir-ssr-greeting name={counter.value}></dathomir-ssr-greeting>
      <dathomir-ssr-counter initial="10"></dathomir-ssr-counter>
      <dathomir-ssr-counter initial={counter.value}></dathomir-ssr-counter>
    </main>
  );
}

export default App;
