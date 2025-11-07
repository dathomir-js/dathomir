import { signal, computed } from "@dathomir/reactivity";
import { describe, it, expect } from "vitest";

import { jsx } from "../src/jsx-runtime/index";
import { VNodeFlags } from "../src/jsx-runtime/vNode";

// Combined test suite for jsx-runtime VNode generation

describe("jsx-runtime VNode generation", () => {
  it("basic: VNode with computed child and proper flags", () => {
    const count = signal(0);
    const node = jsx("div", {
      children: computed(() => count.value),
      dataAttr: "data-attr",
    });
    expect(node).toMatchObject({
      t: "div",
      k: undefined,
      p: { dataAttr: "data-attr" },
      c: [
        expect.objectContaining({
          __type__: "computed",
          value: 0,
          peek: expect.any(Function),
        }),
      ],
      f: VNodeFlags.ELEMENT | VNodeFlags.REACTIVE_CHILD,
    });
    expect((node.f! & VNodeFlags.REACTIVE_PROP) === 0).toBe(true);
  });

  it("reactive prop only (no reactive children)", () => {
    const node = jsx("div", {
      dataAttr: computed(() => "x"),
      children: "static",
    });
    expect(node).toMatchObject({
      t: "div",
      p: {
        dataAttr: expect.objectContaining({
          __type__: "computed",
          value: "x",
          peek: expect.any(Function),
        }),
      },
      c: ["static"],
      f: VNodeFlags.ELEMENT | VNodeFlags.REACTIVE_PROP,
    });
    expect((node.f! & VNodeFlags.REACTIVE_CHILD) === 0).toBe(true);
  });

  it("mixed children flatten with reactive child", () => {
    const count = signal(1);
    const node = jsx("div", {
      children: ["x", computed(() => count.value), ["y"]],
    });
    expect(node).toMatchObject({
      t: "div",
      c: [
        "x",
        expect.objectContaining({
          __type__: "computed",
          value: 1,
          peek: expect.any(Function),
        }),
        "y",
      ],
      f: VNodeFlags.ELEMENT | VNodeFlags.REACTIVE_CHILD,
    });
    expect((node.f! & VNodeFlags.REACTIVE_PROP) === 0).toBe(true);
  });

  it("Keyed element with static child", () => {
    const node = jsx("li", { children: "item" }, "k1");
    expect(node).toMatchObject({
      t: "li",
      k: "k1",
      c: ["item"],
      f: VNodeFlags.ELEMENT,
    });
  });

  it("Null/boolean children retention (current normalize behavior)", () => {
    const node = jsx("div", { children: [null, false, "ok"] });
    expect(node).toMatchObject({
      t: "div",
      c: [null, false, "ok"],
      f: VNodeFlags.ELEMENT,
    });
  });

  it("Reactive prop and reactive child together", () => {
    const count = signal(5);
    const node = jsx("div", {
      dataAttr: computed(() => "x"),
      children: [computed(() => count.value), "static"],
    });
    expect(node).toMatchObject({
      t: "div",
      p: { dataAttr: expect.any(Object) },
      c: [
        expect.objectContaining({
          __type__: "computed",
          value: 5,
          peek: expect.any(Function),
        }),
        "static",
      ],
      f:
        VNodeFlags.ELEMENT |
        VNodeFlags.REACTIVE_PROP |
        VNodeFlags.REACTIVE_CHILD,
    });
  });
});
