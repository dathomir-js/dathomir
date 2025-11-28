import { describe, expect, it } from "vitest";

import { hydrate, mount, renderToString, type VNode } from "../src";
import { Fragment, jsx } from "../src/jsx-runtime";
import { computed, signal } from "../src/reactivity";

// Helper to build VNode manually (simulate jsx output)
const h = (
  t: VNode["t"],
  p?: Record<string, any>,
  c?: any[],
  k?: any,
  f?: number,
): VNode => ({ t, p, c, k, f });

describe("hydrate basic", () => {
  it("hydrates static element with text child", () => {
    const vNode = h("div", { id: "root" }, ["hello"], undefined, 1);
    const container = document.createElement("div");

    // Simulate SSR content
    container.innerHTML = '<div id="root">hello</div>';

    hydrate(vNode, container);
    expect(container.innerHTML).toBe('<div id="root">hello</div>');
  });

  it("clears existing SSR content and re-mounts", () => {
    const vNode = h("div", { class: "app" }, ["updated"], undefined, 1);
    const container = document.createElement("div");

    // Simulate SSR content with slightly different content
    container.innerHTML = '<div class="app">original</div>';

    hydrate(vNode, container);
    expect(container.innerHTML).toBe('<div class="app">updated</div>');
  });

  it("produces same DOM as mount for static content", () => {
    const vNode = h("div", { id: "test" }, ["content"], undefined, 1);

    const mountContainer = document.createElement("div");
    mount(vNode, mountContainer);

    const hydrateContainer = document.createElement("div");
    hydrateContainer.innerHTML = renderToString(vNode);
    hydrate(vNode, hydrateContainer);

    expect(hydrateContainer.innerHTML).toBe(mountContainer.innerHTML);
  });
});

describe("hydrate with events", () => {
  it("binds click event handler after hydration", () => {
    let clicked = 0;
    const vNode = h(
      "button",
      { onClick: () => clicked++ },
      ["click me"],
      undefined,
      1,
    );

    const container = document.createElement("div");
    // SSR output has no event handlers
    container.innerHTML = "<button>click me</button>";

    hydrate(vNode, container);

    const btn = container.querySelector("button")!;
    btn.click();
    expect(clicked).toBe(1);
    btn.click();
    expect(clicked).toBe(2);
  });

  it("binds input event handler after hydration", () => {
    let lastValue = "";
    const vNode = h(
      "input",
      {
        type: "text",
        onInput: (e: Event) => {
          lastValue = (e.target as HTMLInputElement).value;
        },
      },
      [],
      undefined,
      1,
    );

    const container = document.createElement("div");
    container.innerHTML = '<input type="text">';

    hydrate(vNode, container);

    const input = container.querySelector("input")!;
    input.value = "test";
    input.dispatchEvent(new Event("input"));
    expect(lastValue).toBe("test");
  });
});

describe("hydrate reactive props", () => {
  it("updates class reactively after hydration", async () => {
    const cls = signal("a");
    const vNode = h(
      "div",
      { class: computed(() => cls.value) },
      ["x"],
      undefined,
      1 | 16,
    );

    const container = document.createElement("div");
    container.innerHTML = '<div class="a">x</div>';

    hydrate(vNode, container);
    expect(container.firstElementChild?.getAttribute("class")).toBe("a");

    cls.set("b");
    await Promise.resolve();
    expect(container.firstElementChild?.getAttribute("class")).toBe("b");
  });

  it("updates style reactively after hydration", async () => {
    const size = signal(10);
    const vNode = h(
      "div",
      { style: computed(() => ({ fontSize: size.value + "px" })) },
      ["x"],
      undefined,
      1 | 16,
    );

    const container = document.createElement("div");
    container.innerHTML = '<div style="font-size:10px">x</div>';

    hydrate(vNode, container);
    expect(container.firstElementChild?.getAttribute("style")).toBe(
      "font-size:10px",
    );

    size.set(12);
    await Promise.resolve();
    expect(container.firstElementChild?.getAttribute("style")).toBe(
      "font-size:12px",
    );
  });
});

describe("hydrate reactive children", () => {
  it("updates text content reactively after hydration", async () => {
    const n = signal(0);
    const vNode = h(
      "div",
      {},
      [computed(() => String(n.value))],
      undefined,
      1 | 32,
    );

    const container = document.createElement("div");
    container.innerHTML = "<div>0</div>";

    hydrate(vNode, container);
    expect(container.innerHTML).toBe("<div>0</div>");

    n.set(1);
    await Promise.resolve();
    expect(container.innerHTML).toBe("<div>1</div>");
  });

  it("switches element types reactively after hydration", async () => {
    const mode = signal(true);
    const vNode = h(
      "div",
      {},
      [computed(() => (mode.value ? "A" : h("span", {}, ["B"], undefined, 1)))],
      undefined,
      1 | 32,
    );

    const container = document.createElement("div");
    container.innerHTML = "<div>A</div>";

    hydrate(vNode, container);
    expect(container.innerHTML).toBe("<div>A</div>");

    mode.set(false);
    await Promise.resolve();
    expect(container.innerHTML).toBe("<div><span>B</span></div>");
  });
});

describe("hydrate Fragment", () => {
  it("hydrates fragment children directly to parent", () => {
    const vNode = jsx(Fragment, { children: ["A", "B"] });

    const container = document.createElement("div");
    container.innerHTML = "AB";

    hydrate(vNode, container);
    expect(container.innerHTML).toBe("AB");
  });

  it("hydrates nested fragments", () => {
    const vNode = jsx(Fragment, {
      children: ["A", jsx(Fragment, { children: ["B", "C"] }), "D"],
    });

    const container = document.createElement("div");
    container.innerHTML = "ABCD";

    hydrate(vNode, container);
    expect(container.innerHTML).toBe("ABCD");
  });
});

describe("hydrate SSR -> CSR consistency", () => {
  it("renderToString output matches hydrated mount output", () => {
    const vNode = h(
      "article",
      { class: "post" },
      [
        h("h1", {}, ["Title"], undefined, 1),
        h("p", {}, ["Content"], undefined, 1),
      ],
      undefined,
      1,
    );

    // SSR side
    const ssrHtml = renderToString(vNode);

    // CSR hydration
    const container = document.createElement("div");
    container.innerHTML = ssrHtml;
    hydrate(vNode, container);

    // Compare with fresh mount
    const freshContainer = document.createElement("div");
    mount(vNode, freshContainer);

    expect(container.innerHTML).toBe(freshContainer.innerHTML);
  });

  it("complex nested structure hydration", () => {
    const vNode = h(
      "div",
      { id: "app" },
      [
        h("header", {}, [h("nav", {}, ["Menu"], undefined, 1)], undefined, 1),
        h(
          "main",
          {},
          [
            h("section", { class: "content" }, ["Hello"], undefined, 1),
            h("aside", {}, ["Sidebar"], undefined, 1),
          ],
          undefined,
          1,
        ),
        h("footer", {}, ["© 2024"], undefined, 1),
      ],
      undefined,
      1,
    );

    const ssrHtml = renderToString(vNode);
    const container = document.createElement("div");
    container.innerHTML = ssrHtml;

    hydrate(vNode, container);

    const freshContainer = document.createElement("div");
    mount(vNode, freshContainer);

    expect(container.innerHTML).toBe(freshContainer.innerHTML);
  });
});
