/**
 * Web Components for SSR/DSD demonstration.
 *
 * This demonstrates:
 * - Declarative Shadow DOM (DSD) generation in SSR
 * - Hydration of DSD content
 * - Web Component lifecycle with SSR
 */

import { css, defineComponent } from "@dathomir/components";
import { signal } from "@dathomir/core";

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
  }

  h2 {
    color: #4a90e2;
    margin-top: 0;
  }

  .count {
    font-size: 48px;
    font-weight: bold;
    color: #333;
    margin: 20px 0;
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

export const SSRCounter = defineComponent(
  "dathomir-ssr-counter",
  (host, ctx) => {
    const initialCount = parseInt(ctx.attrs["initial"]?.value || "0", 10);
    const count = signal(initialCount);

    return (
      <div class="counter">
        <h2>SSR Web Component Counter</h2>
        <div class="count">{count.value}</div>
        <div class="buttons">
          <button onClick={() => count.value--}>−</button>
          <button onClick={() => (count.value = 0)}>Reset</button>
          <button onClick={() => count.value++}>+</button>
        </div>
        <div class="info">
          <span class="ssr-badge">SSR + DSD</span>
          <br />
          This component uses Web Components and Shadow DOM
          <br />
          Initial count was {initialCount}
        </div>
      </div>
    );
  },
  { styles: [counterStyles], attrs: ["initial"] },
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
  (host, ctx) => {
    const name = ctx.attrs["name"]?.value || "World";

    return (
      <div>
        <h3>Hello, {name}!</h3>
        <p>This Web Component uses Declarative Shadow DOM for instant rendering.</p>
      </div>
    );
  },
  { styles: [greetingStyles], attrs: ["name"] },
);

// Export a helper to register all components
export function registerSSRComponents() {
  console.log("✅ SSR Web Components registered");
}
