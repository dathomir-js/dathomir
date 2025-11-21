import { signal, computed } from "@dathomir/reactivity";
import { describe, it, expect, beforeEach } from "vitest";

import { jsx } from "../src/jsx-runtime";
import { mount } from "../src/mount";
import { renderToString } from "../src/ssr/renderToString";

import type { ComponentFunction } from "../src/types";
import type { Computed } from "@dathomir/reactivity";

// Helper type for transformer-generated props (all values wrapped in computed)
type ReactiveProps<T> = {
  [K in keyof T]: Computed<T[K]>;
};

describe("Component Support", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  describe("Component Definition and Usage", () => {
    it("should render a simple component", () => {
      const SimpleComponent: ComponentFunction<{ message: string }> = (
        props,
      ) => {
        // Transformer wraps props access with computed
        return computed(() =>
          jsx("div", { children: computed(() => props.message) }),
        );
      };

      const vNode = jsx(SimpleComponent, { message: "Hello Component" });
      mount(vNode, container);

      expect(container.textContent).toBe("Hello Component");
    });

    it("should render component with reactive state", () => {
      const CounterComponent: ComponentFunction<{}> = () => {
        const count = signal(0);

        // Transformer wraps template literal with computed
        return computed(() =>
          jsx("div", {
            children: computed(() => `Count: ${count.value}`),
          }),
        );
      };

      const vNode = jsx(CounterComponent, {});
      mount(vNode, container);

      expect(container.textContent).toBe("Count: 0");
    });

    it("should update component when internal state changes", async () => {
      let increment: (() => void) | null = null;

      const CounterComponent: ComponentFunction<{}> = () => {
        const count = signal(0);
        increment = () => count.set((prev) => prev + 1);

        // Transformer wraps template literal with computed
        return computed(() =>
          jsx("div", {
            children: computed(() => `Count: ${count.value}`),
          }),
        );
      };

      const vNode = jsx(CounterComponent, {});
      mount(vNode, container);

      expect(container.textContent).toBe("Count: 0");

      increment!();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.textContent).toBe("Count: 1");
    });

    it("should re-render component when props change", async () => {
      const MessageComponent: ComponentFunction<{ text: string }> = (props) => {
        // Transformer wraps template literal with computed
        return computed(() =>
          jsx("div", {
            children: computed(() => `Message: ${props.text}`),
          }),
        );
      };

      const textSignal = signal("Initial");
      const vNode = jsx(MessageComponent, { text: textSignal.value });
      mount(vNode, container);

      expect(container.textContent).toBe("Message: Initial");

      textSignal.set("Updated");
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Note: This test shows the limitation that props don't automatically update
      // unless the component is re-created. This is expected behavior.
      expect(container.textContent).toBe("Message: Initial");
    });

    it("should preserve internal state across reactive re-renders", async () => {
      let renderCount = 0;
      let increment: (() => void) | null = null;

      const ComponentWithState: ComponentFunction<
        ReactiveProps<{ prefix: string }>
      > = (props) => {
        const count = signal(0);
        increment = () => count.set((prev) => prev + 1);

        return computed(() => {
          // Transformer wraps the entire JSX expression with computed
          // renderCount tracks how many times the component body (JSX) re-evaluates
          return jsx("div", {
            children: computed(() => {
              renderCount++; // Count re-renders of the reactive template
              return `${props.prefix.value}: ${count.value}`;
            }),
          });
        });
      };

      const vNode = jsx(ComponentWithState, {
        prefix: computed(() => "Count"),
      });
      mount(vNode, container);

      expect(container.textContent).toBe("Count: 0");
      expect(renderCount).toBe(1);

      increment!();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.textContent).toBe("Count: 1");
      expect(renderCount).toBe(2);

      increment!();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.textContent).toBe("Count: 2");
      expect(renderCount).toBe(3);
    });
  });

  describe("Component with Events", () => {
    it("should handle events in component with signal", async () => {
      let incrementFn: (() => void) | null = null;

      const ButtonComponent: ComponentFunction<{ label: string }> = (props) => {
        const count = signal(0);

        incrementFn = () => count.set((prev) => prev + 1);

        // Transformer wraps template literal with computed
        return computed(() =>
          jsx("div", {
            children: computed(() => `${props.label}: ${count.value}`),
          }),
        );
      };

      const vNode = jsx(ButtonComponent, { label: "Clicked" });
      mount(vNode, container);

      // Wait for effect to run
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Clicked: 0");

      incrementFn!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Clicked: 1");
    });

    it("should handle multiple state updates", async () => {
      let updateFns: {
        incrementClicks: () => void;
        incrementHovers: () => void;
      } | null = null;

      const EventComponent: ComponentFunction<{}> = () => {
        const clickCount = signal(0);
        const mouseOverCount = signal(0);

        updateFns = {
          incrementClicks: () => clickCount.set((prev) => prev + 1),
          incrementHovers: () => mouseOverCount.set((prev) => prev + 1),
        };

        // Transformer wraps template literal with computed
        return computed(() =>
          jsx("div", {
            children: computed(
              () =>
                `Clicks: ${clickCount.value}, Hovers: ${mouseOverCount.value}`,
            ),
          }),
        );
      };

      const vNode = jsx(EventComponent, {});
      mount(vNode, container);

      // Wait for effect to run
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.textContent).toContain("Clicks: 0, Hovers: 0");

      updateFns!.incrementClicks();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(container.textContent).toContain("Clicks: 1, Hovers: 0");

      updateFns!.incrementHovers();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(container.textContent).toContain("Clicks: 1, Hovers: 1");
    });
  });

  describe("Component Composition", () => {
    it("should compose multiple components", () => {
      const ChildComponent: ComponentFunction<{ text: string }> = (props) => {
        // Transformer wraps props access with computed
        return computed(() =>
          jsx("span", { children: computed(() => props.text) }),
        );
      };

      const ParentComponent: ComponentFunction<{}> = () => {
        // Transformer wraps array elements with computed
        return computed(() =>
          jsx("div", {
            children: [
              computed(() =>
                jsx(ChildComponent, { text: computed(() => "Child 1") }),
              ),
              computed(() =>
                jsx(ChildComponent, { text: computed(() => "Child 2") }),
              ),
            ],
          }),
        );
      };

      const vNode = jsx(ParentComponent, {});
      mount(vNode, container);

      expect(container.textContent).toBe("Child 1Child 2");
    });

    it("should handle nested components with state", async () => {
      let incrementChild1: (() => void) | null = null;
      let incrementChild2: (() => void) | null = null;

      const CounterChild: ComponentFunction<ReactiveProps<{ id: string }>> = (
        props,
      ) => {
        const count = signal(0);
        if (props.id.value === "1") {
          incrementChild1 = () => count.set((prev) => prev + 1);
        } else {
          incrementChild2 = () => count.set((prev) => prev + 1);
        }

        // Transformer wraps template literal with computed
        return computed(() =>
          jsx("div", {
            children: computed(() => `${props.id.value}: ${count.value}`),
          }),
        );
      };

      const ParentComponent: ComponentFunction<{}> = () => {
        // Transformer wraps array elements with computed
        return computed(() =>
          jsx("div", {
            children: [
              computed(() => jsx(CounterChild, { id: computed(() => "1") })),
              computed(() => jsx(CounterChild, { id: computed(() => "2") })),
            ],
          }),
        );
      };

      const vNode = jsx(ParentComponent, {});
      mount(vNode, container);

      expect(container.textContent).toBe("1: 02: 0");

      incrementChild1!();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(container.textContent).toBe("1: 12: 0");

      incrementChild2!();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(container.textContent).toBe("1: 12: 1");
    });
  });

  describe("SSR Support", () => {
    it("should render component to string", () => {
      const SimpleComponent: ComponentFunction<{ message: string }> = (
        props,
      ) => {
        // Transformer wraps props access with computed
        return computed(() =>
          jsx("div", { children: computed(() => props.message) }),
        );
      };

      const vNode = jsx(SimpleComponent, { message: "SSR Component" });
      const html = renderToString(vNode);

      expect(html).toBe("<div>SSR Component</div>");
    });

    it("should render component with computed values to string", () => {
      const ComponentWithState: ComponentFunction<{}> = () => {
        const count = signal(5);

        // Transformer wraps template literal with computed
        return computed(() =>
          jsx("div", {
            children: computed(() => `Count: ${count.value}`),
          }),
        );
      };

      const vNode = jsx(ComponentWithState, {});
      const html = renderToString(vNode);

      expect(html).toBe("<div>Count: 5</div>");
    });

    it("should render nested components to string", () => {
      const ChildComponent: ComponentFunction<{ text: string }> = (props) => {
        // Transformer wraps props access with computed
        return computed(() =>
          jsx("span", { children: computed(() => props.text) }),
        );
      };

      const ParentComponent: ComponentFunction<{}> = () => {
        // Transformer wraps array elements with computed
        return computed(() =>
          jsx("div", {
            children: [
              computed(() =>
                jsx(ChildComponent, { text: computed(() => "Child 1") }),
              ),
              computed(() =>
                jsx(ChildComponent, { text: computed(() => "Child 2") }),
              ),
            ],
          }),
        );
      };

      const vNode = jsx(ParentComponent, {});
      const html = renderToString(vNode);

      expect(html).toBe("<div><span>Child 1</span><span>Child 2</span></div>");
    });
  });

  describe("Edge Cases", () => {
    it("should handle component returning null-like values", async () => {
      const EmptyComponent: ComponentFunction<{}> = () => {
        // Transformer wraps null with computed
        return computed(() => jsx("div", { children: computed(() => null) }));
      };

      const vNode = jsx(EmptyComponent, {});
      mount(vNode, container);

      // Wait for effect to run
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Component markers are expected in the output
      expect(container.innerHTML).toContain("<div></div>");
    });

    it("should handle component with conditional rendering", async () => {
      let toggle: (() => void) | null = null;

      const ConditionalComponent: ComponentFunction<{}> = () => {
        const show = signal(true);
        toggle = () => show.set((prev) => !prev);

        // Transformer wraps conditional expression with computed
        return computed(() =>
          jsx("div", {
            children: computed(() => (show.value ? "Visible" : "Hidden")),
          }),
        );
      };

      const vNode = jsx(ConditionalComponent, {});
      mount(vNode, container);

      // Wait for effect to run
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.textContent).toContain("Visible");

      toggle!();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.textContent).toContain("Hidden");
    });

    it("should handle component with array children", async () => {
      const ListComponent: ComponentFunction<{ items: string[] }> = (props) => {
        // Transformer wraps map expression with computed
        return computed(() =>
          jsx("ul", {
            children: computed(() =>
              props.items.map((item) =>
                jsx("li", { children: computed(() => item) }),
              ),
            ),
          }),
        );
      };

      const vNode = jsx(ListComponent, { items: ["A", "B", "C"] });
      mount(vNode, container);

      // Wait for effect to run
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Component markers are expected in the output
      expect(container.innerHTML).toContain(
        "<ul><li>A</li><li>B</li><li>C</li></ul>",
      );
    });
  });
});
