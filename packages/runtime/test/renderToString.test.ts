import { signal, computed } from "@dathomir/reactivity";
import { describe, it, expect } from "vitest";

import { jsx as _jsx, jsxs as _jsxs, Fragment } from "../src/jsx-runtime/index"; // mimic compiled output
import { renderToString } from "../src/ssr/renderToString";

describe("renderToString", () => {
  it("escapes string and number children", () => {
    const html = renderToString(_jsxs("div", { children: ["<script>", 10] }));
    expect(html).toBe("<div>&lt;script&gt;10</div>");
  });

  it("omits boolean children", () => {
    const html = renderToString(
      _jsxs("span", { children: [true, false, "ok"] }),
    );
    expect(html).toBe("<span>ok</span>");
  });

  it("serializes basic attributes (string/number/boolean true)", () => {
    const html = renderToString(
      _jsx("input", { type: "text", value: "abc", disabled: true, size: 3 }),
    );
    expect(html).toBe('<input type="text" value="abc" disabled size="3">');
  });

  it("excludes null/undefined/false attributes", () => {
    const html = renderToString(
      _jsx("div", { a: null as any, b: undefined as any, c: false as any }),
    );
    expect(html).toBe("<div></div>");
  });

  it("serializes style object with kebab-case keys", () => {
    const html = renderToString(
      _jsx("div", { style: { backgroundColor: "red", fontSize: "12px" } }),
    );
    expect(html).toBe(
      '<div style="background-color:red;font-size:12px"></div>',
    );
  });

  it("renders void element without closing tag", () => {
    const html = renderToString(_jsx("br", {}));
    expect(html).toBe("<br>");
  });

  it("unwraps reactive signal/computed values", () => {
    const cnt = signal(1);
    const dbl = computed(() => cnt.value * 2);
    const html = renderToString(
      _jsxs("div", {
        children: [computed(() => cnt.value), "-", computed(() => dbl.value)],
      }),
    );
    expect(html).toBe("<div>1-2</div>");
  });

  it("flattens nested array children", () => {
    const html = renderToString(
      _jsxs("div", { children: [["a", ["b"], "c"]] }),
    );
    expect(html).toBe("<div>abc</div>");
  });

  it("renders empty style object as empty attribute value", () => {
    const html = renderToString(_jsx("div", { style: {} }));
    expect(html).toBe('<div style=""></div>');
  });

  it("excludes dangerous on* and ref attributes", () => {
    const html = renderToString(
      _jsx("button", { onClick: () => {}, ref: () => {}, type: "button" }),
    );
    expect(html).toBe('<button type="button"></button>');
  });

  it("renders fragment children", () => {
    const vNode = _jsx(Fragment, { children: ["A", "B"] });
    const html = renderToString(vNode);
    expect(html).toBe("AB");
  });

  it("renders nested fragments", () => {
    const vNode = _jsx(Fragment, {
      children: ["A", _jsx(Fragment, { children: ["B", "C"] }), "D"],
    });
    const html = renderToString(vNode);
    expect(html).toBe("ABCD");
  });
});

// Extra coverage suite merged from renderToString.extra.test.ts
describe("renderToString (extra)", () => {
  it("uses custom escape function", () => {
    const html = renderToString(_jsx("div", { children: '5 < 6 & "x"' }), {
      escape: (v: unknown) => `__${String(v)}__`,
    });
    expect(html).toBe('<div>__5 < 6 & "x"__</div>');
  });
  it("applies attributeFilter to remove attributes", () => {
    const html = renderToString(
      _jsx("div", { a: "keep", b: "drop", c: true }),
      { attributeFilter: (k: string) => k !== "b" },
    );
    expect(html).toBe('<div a="keep" c></div>');
  });
  it("handles void element with attributes", () => {
    const html = renderToString(_jsx("img", { src: "x.png", alt: "x" }));
    expect(html).toBe('<img src="x.png" alt="x">');
  });
  it("quotes escaping in attribute values", () => {
    const html = renderToString(_jsx("div", { title: 'He said: "Hi"' }));
    expect(html).toBe('<div title="He said: &quot;Hi&quot;"></div>');
  });
  it("numeric zero attribute value", () => {
    const html = renderToString(_jsx("div", { ["data-count"]: 0 }));
    expect(html).toBe('<div data-count="0"></div>');
  });
  it("reactive computed returning array children flattened", () => {
    const a = signal("x");
    const arrComp = computed(() => [a.value, "y"]);
    const html = renderToString(_jsx("div", { children: arrComp }));
    expect(html).toBe("<div>xy</div>");
  });
  it("style skips falsy entries", () => {
    const html = renderToString(
      _jsx("div", {
        style: {
          color: "red",
          display: null,
          fontSize: false,
          lineHeight: "1.2",
        },
      }),
    );
    expect(html).toBe('<div style="color:red;line-height:1.2"></div>');
  });
  it("attributeFilter blocks true boolean attribute entirely", () => {
    const html = renderToString(
      _jsx("input", { disabled: true, required: true }),
      {
        attributeFilter: (k: string) => k !== "required",
      },
    );
    expect(html).toBe("<input disabled>");
  });
  it("empty props object on host element", () => {
    const html = renderToString(_jsx("div", {}));
    expect(html).toBe("<div></div>");
  });
  it("attributeFilter removes style attribute entirely", () => {
    const html = renderToString(_jsx("div", { style: { color: "red" } }), {
      attributeFilter: (k: string) => k !== "style",
    });
    expect(html).toBe("<div></div>");
  });
  it("array children including vnodes and primitives", () => {
    const html = renderToString(
      _jsxs("div", { children: ["A", [_jsx("span", { children: "B" }), "C"]] }),
    );
    expect(html).toBe("<div>A<span>B</span>C</div>");
  });
  it("default escape handles single quotes in text child", () => {
    const html = renderToString(_jsx("div", { children: "Bob's" }));
    expect(html).toBe("<div>Bob&#39;s</div>");
  });
  it("attributeFilter removes true boolean attribute", () => {
    const html = renderToString(
      _jsx("input", { disabled: true, autofocus: true }),
      {
        attributeFilter: (k: string) => k !== "autofocus",
      },
    );
    expect(html).toBe("<input disabled>");
  });
});
