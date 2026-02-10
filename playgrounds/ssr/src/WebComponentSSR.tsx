/**
 * Web Components for SSR/DSD demonstration.
 *
 * This demonstrates:
 * - Declarative Shadow DOM (DSD) generation in SSR
 * - Hydration of DSD content
 * - Web Component lifecycle with SSR
 */

import { css, defineComponent } from "@dathomir/components";

// Counter Web Component with SSR support
const counterStyles = css`
  :host {
    display: block;
    padding: 20px;
    border: 2px solid #4a90e2;
    border-radius: 8px;
    margin: 20px 0;
  }

  .counter {
    text-align: center;
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  h2 {
    color: #4a90e2;
    margin-top: 0;
  }

  .count {
    font-size: 48px;
    font-weight: bold;
    color: #333;
  }

  .buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  button {
    padding: 10px 20px;
    font-size: 16px;
    border: 2px solid #4a90e2;
    background: white;
    color: #4a90e2;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:hover {
    background: #4a90e2;
    color: white;
  }

  button:active {
    transform: scale(0.95);
  }

  .info {
    margin-top: 20px;
    padding: 10px;
    background: #f0f7ff;
    border-radius: 4px;
    font-size: 14px;
    color: #666;
  }

  .ssr-badge {
    display: inline-block;
    padding: 4px 8px;
    background: #4caf50;
    color: white;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
  }
`;

// export function Counter({ initialCount = 0 }: { initialCount?: number }) {
//   return (
//     <div class="counter-container">
//       <h2>SSR Counter</h2>
//       <div class="counter">
//         <button onClick={() => count.update((v) => v - 1)}>-</button>
//         <span class="count">{count.value}</span>
//         <button onClick={() => count.update((v) => v + 1)}>+</button>
//         {count.value % 2 === 0 ? (
//           <span class="even-indicator"> (Even)</span>
//         ) : (
//           <span>
//             {" "}
//             (Odd) <span>{count.value}</span>
//           </span>
//         )}
//       </div>
//       <div class="info">
//         <p>This component was server-side rendered and hydrated on the client.</p>
//         <p>Initial count from server: {initialCount}</p>
//         <p>Current count: {count.value}</p>
//       </div>
//     </div>
//   );
// };

export const SSRCounter = defineComponent(
  "dathomir-ssr-counter",
  ({ initialCount }) => {
      return (
      <div class="counter-container">
        <h2>SSR Counter</h2>
        <div class="counter">
          <button onClick={() => initialCount.update((v) => v - 1)}>-</button>
          <span class="count">{initialCount.value}</span>
          <button onClick={() => initialCount.update((v) => v + 1)}>+</button>
          {initialCount.value % 2 === 0 ? (
            <span class="even-indicator"> (Even)</span>
          ) : (
            <span>
              {" "}
              (Odd) <span>{initialCount.value}</span>
            </span>
          )}
        </div>
        <div class="info">
          <p>This component was server-side rendered and hydrated on the client.</p>
          <p>Initial count from server: {initialCount.value}</p>
          <p>Current count: {initialCount.value}</p>
        </div>
      </div>
    );
  },
  {
    styles: [counterStyles],
    props: { initialCount: { type: Number, default: 0, attribute: "initial" } },
  },
);

// Simple greeting Web Component
const greetingStyles = css`
  :host {
    display: block;
    padding: 15px;
    border-radius: 8px;
    margin: 20px 0;
  }

  h3 {
    margin: 0 0 10px 0;
  }

  p {
    margin: 0;
    opacity: 0.9;
  }
`;

export const SSRGreeting = defineComponent(
  "dathomir-ssr-greeting",
  ({ name }) => {
    return (
      <div>
        <h3>Hello, {name.value}!</h3>
        <p>This Web Component uses Declarative Shadow DOM for instant rendering.</p>
      </div>
    );
  },
  { styles: [greetingStyles], props: { name: { type: String, default: "World" } } },
);

// Export a helper to register all components
export function registerSSRComponents() {
  console.log("✅ SSR Web Components registered");
}
