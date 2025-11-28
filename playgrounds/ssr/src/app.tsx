import { signal } from "@dathomir/core/reactivity";

export function App() {
  const count = signal(0);
  const inc = () => count.set(prev => prev + 1);
  const dec = () => count.set(prev => prev - 1);
  const reset = () => count.set(0);

  return (
    <div class="ssr-app">
      <h1>SSR Playground</h1>
      <p>{typeof window !== "undefined" ? "Client" : "Server"}</p>
      <div class="counter">
        <p>
          Count: <strong class="count-value">{count.value}</strong>
        </p>
        <div class="buttons">
          <button onClick={dec}>-1</button>
          <button onClick={inc}>+1</button>
          <button onClick={reset}>Reset</button>
        </div>
      </div>
    </div>
  );
}

export default App;
