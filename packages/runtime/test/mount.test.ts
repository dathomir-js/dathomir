import { describe, it, expect } from "vitest";

import { mount, type VNode } from "../src";
import { signal, computed } from "../src/reactivity";

// Helper to build VNode manually (simulate jsx output)
const h = (
  t: VNode["t"],
  p?: Record<string, any>,
  c?: any[],
  k?: any,
  f?: number,
): VNode => ({ t, p, c, k, f });

describe("mount basic", () => {
  it("mounts static element with text child", () => {
    const vNode = h("div", { id: "root" }, ["hello"], undefined, 1);
    const container = document.createElement("div");
    mount(vNode, container);
    expect(container.innerHTML).toBe('<div id="root">hello</div>');
  });
});

describe("mount reactive props", () => {
  it("updates class reactively", async () => {
    const cls = signal("a");
    const vNode = h(
      "div",
      { class: computed(() => cls.value) },
      ["x"],
      undefined,
      1 | 16,
    );
    const container = document.createElement("div");
    mount(vNode, container);
    expect(container.firstElementChild?.getAttribute("class")).toBe("a");
    cls.set("b");
    // microtask flush for effect scheduling (assumption)
    await Promise.resolve();
    expect(container.firstElementChild?.getAttribute("class")).toBe("b");
  });

  it("updates style reactively (object)", async () => {
    const size = signal(10);
    const vNode = h(
      "div",
      { style: computed(() => ({ fontSize: size.value + "px" })) },
      ["x"],
      undefined,
      1 | 16,
    );
    const container = document.createElement("div");
    mount(vNode, container);
    expect(container.firstElementChild?.getAttribute("style")).toBe(
      "font-size: 10px;",
    );
    size.set(12);
    await Promise.resolve();
    expect(container.firstElementChild?.getAttribute("style")).toBe(
      "font-size: 12px;",
    );
  });
});

describe("mount reactive child", () => {
  it("text updates", async () => {
    const n = signal(0);
    const vNode = h(
      "div",
      {},
      [computed(() => String(n.value))],
      undefined,
      1 | 32,
    );
    const container = document.createElement("div");
    mount(vNode, container);
    expect(container.innerHTML).toBe("<div>0</div>");
    n.set(1);
    await Promise.resolve();
    expect(container.innerHTML).toBe("<div>1</div>");
  });

  it("switches to element child", async () => {
    const mode = signal(true);
    const vNode = h(
      "div",
      {},
      [computed(() => (mode.value ? "A" : h("span", {}, ["B"], undefined, 1)))],
      undefined,
      1 | 32,
    );
    const container = document.createElement("div");
    mount(vNode, container);
    expect(container.innerHTML).toBe("<div>A</div>");
    mode.set(false);
    await Promise.resolve();
    expect(container.innerHTML).toBe("<div><span>B</span></div>");
  });

  it("array of mixed nodes", async () => {
    const mode = signal(0);
    const vNode = h(
      "div",
      {},
      [
        computed(() => {
          if (mode.value === 0) return ["A", "B"];
          if (mode.value === 1) return [h("span", {}, ["C"], undefined, 1)];
          return null;
        }),
      ],
      undefined,
      1 | 32,
    );
    const container = document.createElement("div");
    mount(vNode, container);
    expect(container.innerHTML).toBe("<div>AB</div>");
    mode.set(1);
    await Promise.resolve();
    expect(container.innerHTML).toBe("<div><span>C</span></div>");
    mode.set(2);
    await Promise.resolve();
    expect(container.innerHTML).toBe("<div></div>");
  });
});

describe("mount event listeners", () => {
  it("onClick handler fires", () => {
    let clicked = 0;
    const vNode = h(
      "button",
      { onClick: () => clicked++ },
      ["click me"],
      undefined,
      1,
    );
    const container = document.createElement("div");
    mount(vNode, container);
    const btn = container.querySelector("button")!;
    btn.click();
    expect(clicked).toBe(1);
    btn.click();
    expect(clicked).toBe(2);
  });

  it("onInput handler with event object", () => {
    let lastValue = "";
    const vNode = h(
      "input",
      {
        onInput: (e: Event) => {
          lastValue = (e.target as HTMLInputElement).value;
        },
      },
      [],
      undefined,
      1,
    );
    const container = document.createElement("div");
    mount(vNode, container);
    const input = container.querySelector("input")!;
    input.value = "test";
    input.dispatchEvent(new Event("input"));
    expect(lastValue).toBe("test");
  });

  it("reactive onClick handler updates", async () => {
    let count = 0;
    const handler = signal(() => {
      count++;
    });
    const onClick = computed(() => handler.value);

    // Verify computed works
    expect(typeof onClick.value).toBe("function");
    onClick.value();
    expect(count).toBe(1);

    const vNode = h("button", { onClick }, ["btn"], undefined, 1 | 16);
    const container = document.createElement("div");
    mount(vNode, container);
    const btn = container.querySelector("button")!;

    // Wait for effect to run
    await Promise.resolve();

    btn.click();
    expect(count).toBe(2); // Should be 2 now (1 from manual call + 1 from click)

    // Change handler
    handler.set(() => {
      count += 10;
    });
    await Promise.resolve();

    btn.click();
    expect(count).toBe(12); // 2 + 10
  });

  it("onMouseover with multiple listeners (array)", () => {
    let count1 = 0;
    let count2 = 0;
    const vNode = h(
      "div",
      { onMouseover: [() => count1++, () => count2++] },
      ["hover"],
      undefined,
      1,
    );
    const container = document.createElement("div");
    mount(vNode, container);
    const div = container.querySelector("div")!;
    div.dispatchEvent(new MouseEvent("mouseover"));
    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });

  it("event listener with options (once)", () => {
    let count = 0;
    const vNode = h(
      "button",
      { onClick: { listener: () => count++, once: true } },
      ["once"],
      undefined,
      1,
    );
    const container = document.createElement("div");
    mount(vNode, container);
    const btn = container.querySelector("button")!;
    btn.click();
    expect(count).toBe(1);
    btn.click();
    expect(count).toBe(1); // Should not fire again
  });
});
