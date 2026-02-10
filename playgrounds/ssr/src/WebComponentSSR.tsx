/**
 * Web Components for SSR/DSD demonstration.
 *
 * This demonstrates:
 * - Declarative Shadow DOM (DSD) generation in SSR
 * - Hydration of DSD content
 * - Web Component lifecycle with SSR
 */

import { css, defineComponent } from "@dathomir/components";
import { Counter } from "./Counter";

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

export const SSRCounter = defineComponent(
  "dathomir-ssr-counter",
  Counter,
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
  (host, ctx) => {
    return (
      <div>
        <h3>Hello, {ctx.props.name.value}!</h3>
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
