/**
 * Tests for SSR rendering functionality.
 */

import { describe, expect, it } from "vitest";

import { MarkerType, createMarker, renderToString, renderTree } from "@/ssr";
import type { Tree } from "@/types/tree";

describe("SSR Markers", () => {
  it("creates text marker", () => {
    const marker = createMarker(MarkerType.Text, 1);
    expect(marker).toBe("<!--dh:t:1-->");
  });

  it("creates insert marker", () => {
    const marker = createMarker(MarkerType.Insert, 2);
    expect(marker).toBe("<!--dh:i:2-->");
  });

  it("creates block marker", () => {
    const marker = createMarker(MarkerType.Block, 3);
    expect(marker).toBe("<!--dh:b:3-->");
  });
});

describe("SSR Render", () => {
  it("renders simple element", () => {
    const tree: Tree[] = [["div", { class: "container" }, "Hello"]];
    const html = renderTree(tree);
    expect(html).toBe('<div class="container">Hello</div>');
  });

  it("renders nested elements", () => {
    const tree: Tree[] = [["div", null, ["span", null, "Nested"]]];
    const html = renderTree(tree);
    expect(html).toBe("<div><span>Nested</span></div>");
  });

  it("renders void elements correctly", () => {
    const tree: Tree[] = [["input", { type: "text" }]];
    const html = renderTree(tree);
    expect(html).toBe('<input type="text" />');
  });

  it("renders boolean attributes", () => {
    const tree: Tree[] = [["input", { disabled: true, type: "text" }]];
    const html = renderTree(tree);
    expect(html).toContain("disabled");
    expect(html).toContain('type="text"');
  });

  it("skips event handlers in attributes", () => {
    const tree: Tree[] = [["button", { onClick: () => {} }, "Click"]];
    const html = renderTree(tree);
    expect(html).toBe("<button>Click</button>");
    expect(html).not.toContain("onClick");
  });

  it("escapes HTML in text content", () => {
    const tree: Tree[] = [["div", null, "<script>alert('xss')</script>"]];
    const html = renderTree(tree);
    expect(html).toBe("<div>&lt;script&gt;alert('xss')&lt;/script&gt;</div>");
  });

  it("escapes HTML in attribute values", () => {
    const tree: Tree[] = [["div", { title: 'Say "Hello"' }]];
    const html = renderTree(tree);
    expect(html).toBe('<div title="Say &quot;Hello&quot;"></div>');
  });

  it("renders text placeholder with marker", () => {
    const tree: Tree[] = [["div", null, ["{text}", null]]];
    const dynamicValues = new Map<number, unknown>([[1, "Dynamic"]]);
    const html = renderTree(tree, { dynamicValues });
    expect(html).toBe("<div><!--dh:t:1-->Dynamic</div>");
  });

  it("renders each placeholder with block markers", () => {
    const tree: Tree[] = [["ul", null, ["{each}", null]]];
    const items = ["<li>Item 1</li>", "<li>Item 2</li>"];
    const dynamicValues = new Map<number, unknown>([[1, items]]);
    const html = renderTree(tree, { dynamicValues });
    expect(html).toContain("<!--dh:b:1-->");
    expect(html).toContain("<!--/dh:b-->");
  });

  it("renders multiple dynamic values", () => {
    const tree: Tree[] = [
      ["div", null, "Count: ", ["{text}", null], " Items: ", ["{text}", null]],
    ];
    const dynamicValues = new Map<number, unknown>([
      [1, 5],
      [2, 10],
    ]);
    const html = renderTree(tree, { dynamicValues });
    expect(html).toBe(
      "<div>Count: <!--dh:t:1-->5 Items: <!--dh:t:2-->10</div>",
    );
  });
});

describe("SSR renderToString", () => {
  it("renders with state", () => {
    const tree: Tree[] = [["div", null, ["{text}", null]]];
    const state = { count: 5 };
    const dynamicValues = new Map<number, unknown>([[1, 5]]);
    const html = renderToString(tree, state, dynamicValues);

    // Should include state script
    expect(html).toContain("data-dh-state");
    expect(html).toContain("<!--dh:t:1-->");
  });

  it("skips state script when state is empty", () => {
    const tree: Tree[] = [["div", null, "Static"]];
    const html = renderToString(tree);
    expect(html).not.toContain("data-dh-state");
    expect(html).toBe("<div>Static</div>");
  });
});
