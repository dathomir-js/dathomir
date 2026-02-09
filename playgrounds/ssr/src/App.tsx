/**
 * Main App component for SSR demonstration.
 */

import { Counter } from "./Counter";

export function App() {
  return (
    <main>
      <h1>Dathomir SSR Playground</h1>
      <p>{typeof window === "undefined" ? "Server" : <h1>Client</h1>}</p>
      <p>This page demonstrates Server-Side Rendering and Hydration.</p>
      {Counter(5)}
    </main>
  );
}

export default App;
