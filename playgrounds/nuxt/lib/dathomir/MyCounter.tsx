/**
 * Dathomir counter component with reactive state.
 */

import { defineComponent } from "@dathomir/components";
import { signal } from "@dathomir/reactivity";

export const MyCounter = defineComponent(
  "my-counter",
  (host, ctx) => {
    const initialValue = parseInt(ctx.attrs.initial?.value ?? "0", 10);
    const count = signal(initialValue);

    const increment = () => {
      count.value++;
    };

    const decrement = () => {
      count.value--;
    };

    return (
      <div style={{
        padding: "20px",
        border: "2px solid #00dc82",
        borderRadius: "8px",
        background: "#ffffff"
      }}>
        <h3 style={{ margin: "0 0 15px 0" }}>Counter Component</h3>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "15px"
        }}>
          <button
            onClick={decrement}
            style={{
              padding: "10px 20px",
              fontSize: "18px",
              cursor: "pointer",
              background: "#f0f0f0",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            −
          </button>
          <span style={{
            fontSize: "24px",
            fontWeight: "bold",
            minWidth: "50px",
            textAlign: "center"
          }}>
            {count.value}
          </span>
          <button
            onClick={increment}
            style={{
              padding: "10px 20px",
              fontSize: "18px",
              cursor: "pointer",
              background: "#00dc82",
              color: "white",
              border: "none",
              borderRadius: "4px"
            }}
          >
            +
          </button>
        </div>
      </div>
    );
  },
  {
    attrs: ["initial"],
    styles: [`
      :host {
        display: block;
        margin: 20px 0;
      }
      button:hover {
        opacity: 0.8;
      }
    `],
  }
);
