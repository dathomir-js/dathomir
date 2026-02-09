/**
 * Counter component for SSR/Hydration demonstration.
 *
 * This component demonstrates:
 * - Signal-based reactivity
 * - Event handling
 * - SSR rendering with markers
 * - Hydration of SSR-rendered content
 */

import { signal } from "@dathomir/core";

/**
 * Create a counter element with SSR/Hydration support.
 */
export function Counter(initialCount = 0) {
  const count = signal(initialCount);

  return (
    <div class="counter-container">
      <h2>SSR Counter</h2>
      <div class="counter">
        <button onClick={() => count.update((v) => v - 1)}>-</button>
        <span class="count">{count.value}</span>
        <button onClick={() => count.update((v) => v + 1)}>+</button>
        {count.value % 2 === 0 ? (
          <span class="even-indicator"> (Even)</span>
        ) : (
          <span>
            {" "}
            (Odd) <span>{count.value}</span>
          </span>
        )}
      </div>
      <div class="info">
        <p>This component was server-side rendered and hydrated on the client.</p>
        <p>Initial count from server: {initialCount}</p>
        <p>Current count: {count.value}</p>
      </div>
    </div>
  );
}

export default Counter;
