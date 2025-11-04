import { signal, computed, effect } from "@dathomir/reactivity";
import { mount } from "@dathomir/runtime";
import { jsx as _jsx, jsxs as _jsxs } from "@dathomir/runtime/jsx-runtime";
import { renderToString } from "@dathomir/runtime/ssr/renderToString";
import { bench, describe } from "vitest";

describe("JSX Creation", () => {
  bench("create simple element", () => {
    _jsx("div", { children: "Hello" });
  });

  bench("create element with props", () => {
    _jsx("div", { id: "test", className: "container", children: "Hello" });
  });

  bench("create nested elements", () => {
    _jsxs("div", {
      children: [
        _jsx("span", { children: "A" }),
        _jsx("span", { children: "B" }),
        _jsx("span", { children: "C" }),
      ],
    });
  });

  bench("create deep tree (10 levels)", () => {
    let node = _jsx("span", { children: "leaf" });
    for (let i = 0; i < 10; i++) {
      node = _jsx("div", { children: node });
    }
  });
});

describe("Mount Operations", () => {
  bench("mount simple element", () => {
    const container = document.createElement("div");
    const vNode = _jsx("div", { children: "Hello" });
    mount(vNode, container);
  });

  bench("mount with reactive signal", () => {
    const container = document.createElement("div");
    const count = signal(0);
    const vNode = _jsx("div", { children: count });
    mount(vNode, container);
  });

  bench("mount with computed", () => {
    const container = document.createElement("div");
    const count = signal(5);
    const doubled = computed(() => count.value * 2);
    const vNode = _jsx("div", { children: doubled });
    mount(vNode, container);
  });

  bench("mount list (100 items)", () => {
    const container = document.createElement("div");
    const items = Array.from({ length: 100 }, (_, i) =>
      _jsx("li", { children: `Item ${i}` }, `item-${i}`)
    );
    const vNode = _jsx("ul", { children: items });
    mount(vNode, container);
  });
});

describe("SSR renderToString", () => {
  bench("render simple element", () => {
    renderToString(_jsx("div", { children: "Hello" }));
  });

  bench("render with props", () => {
    renderToString(
      _jsx("div", { id: "test", className: "container", children: "Hello" })
    );
  });

  bench("render nested structure", () => {
    renderToString(
      _jsxs("div", {
        children: [
          _jsx("h1", { children: "Title" }),
          _jsxs("ul", {
            children: [
              _jsx("li", { children: "A" }),
              _jsx("li", { children: "B" }),
              _jsx("li", { children: "C" }),
            ],
          }),
        ],
      })
    );
  });

  bench("render list (100 items)", () => {
    const items = Array.from({ length: 100 }, (_, i) =>
      _jsx("li", { children: `Item ${i}` }, `item-${i}`)
    );
    renderToString(_jsx("ul", { children: items }));
  });

  bench("render with reactive (unwrapped)", () => {
    const count = signal(42);
    const doubled = computed(() => count.value * 2);
    renderToString(_jsxs("div", { children: [count, " x 2 = ", doubled] }));
  });
});

describe("Reactivity Performance", () => {
  bench("signal read/write", () => {
    const s = signal(0);
    for (let i = 0; i < 100; i++) {
      s.set(i);
      void s.value;
    }
  });

  bench("computed recalculation", () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.value + b.value);

    for (let i = 0; i < 100; i++) {
      a.set(i);
      void sum.value;
    }
  });

  bench("effect execution", () => {
    const s = signal(0);
    // oxlint-disable-next-line no-unused-vars
    let result = 0;
    const dispose = effect(() => {
      result = s.value * 2;
    });

    for (let i = 0; i < 100; i++) {
      s.set(i);
    }

    dispose();
  });

  bench("batch updates", () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.value + b.value);

    for (let i = 0; i < 10; i++) {
      a.set(i);
      b.set(i * 2);
      void sum.value;
    }
  });
});

describe("Component Rendering", () => {
  const SimpleComponent = ({ text }: { text: string }) =>
    _jsx("div", { children: text });

  bench("render component (SSR)", () => {
    renderToString(_jsx(SimpleComponent, { text: "Hello" }));
  });

  bench("mount component", () => {
    const container = document.createElement("div");
    mount(_jsx(SimpleComponent, { text: "Hello" }), container);
  });

  const NestedComponent = ({ depth }: { depth: number }) => {
    if (depth === 0) return _jsx("span", { children: "leaf" });
    return _jsx(NestedComponent, { depth: depth - 1 });
  };

  bench("render nested components (depth 10)", () => {
    renderToString(_jsx(NestedComponent, { depth: 10 }));
  });
});
