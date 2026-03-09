/**
 * Main App component for SSR demonstration.
 */

import { signal } from "@dathomir/core";
import { Counter } from "./Counter";
import "./WebComponentSSR";

function createSpreadChildContent(label: string): DocumentFragment | string {
  if (typeof document === "undefined") {
    return `<span data-case=\"spread-child\">${label} (server)</span>`;
  }

  const fragment = document.createDocumentFragment();
  const text = document.createTextNode(`${label} (client)`);
  fragment.appendChild(text);
  return fragment;
}

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

      <h2>JSX Compatibility Cases</h2>
      <p id="logical-case">
        {1 && <span data-case="logical">Logical expression render: enabled</span>}
      </p>
      <p id="fallback-case">
        {
          ({
            node: <em data-case="fallback">Fallback nested JSX expression</em>,
          }).node
        }
      </p>
      <p id="spread-child-case">{...createSpreadChildContent("Spread child render")}</p>

      <svg width="120" height="40" viewBox="0 0 120 40" id="namespaced-case">
        <defs>
          <circle id="ssr-dot" cx="10" cy="10" r="8"></circle>
        </defs>
        <use xlink:href="#ssr-dot" x="20" y="10"></use>
      </svg>

      <hr style="margin: 40px 0; border: 1px solid #ddd;" />

      <h2>Web Components with Declarative Shadow DOM</h2>
      <dathomir-ssr-greeting name={counter.value}></dathomir-ssr-greeting>
      <dathomir-ssr-counter initial="10"></dathomir-ssr-counter>
      <dathomir-ssr-counter initial={counter.value}></dathomir-ssr-counter>
    </main>
  );
}

export default App;
