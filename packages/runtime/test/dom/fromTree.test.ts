import { describe, expect, it } from "vitest";

import { firstChild, fromTree, nextSibling } from "../../src/index";

import type { Tree } from "../../src/types/tree";

describe("fromTree", () => {
  it("should create a simple element", () => {
    const tree: Tree[] = [["div", null]];
    const factory = fromTree(tree);
    const fragment = factory();

    expect(fragment).toBeInstanceOf(DocumentFragment);
    expect(fragment.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it("should create an element with attributes", () => {
    const tree: Tree[] = [["button", { class: "btn", disabled: true }]];
    const factory = fromTree(tree);
    const fragment = factory();

    const button = fragment.firstChild as HTMLButtonElement;
    expect(button.className).toBe("btn");
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("should create text nodes", () => {
    const tree: Tree[] = [["p", null, "Hello World"]];
    const factory = fromTree(tree);
    const fragment = factory();

    const p = fragment.firstChild as HTMLParagraphElement;
    expect(p.textContent).toBe("Hello World");
  });

  it("should create nested elements", () => {
    const tree: Tree[] = [["div", null, ["span", null, "text"]]];
    const factory = fromTree(tree);
    const fragment = factory();

    const div = fragment.firstChild as HTMLDivElement;
    const span = div.firstChild as HTMLSpanElement;
    expect(span.tagName).toBe("SPAN");
    expect(span.textContent).toBe("text");
  });

  it("should create placeholder text nodes", () => {
    const tree: Tree[] = [["div", null, ["{text}", null]]];
    const factory = fromTree(tree);
    const fragment = factory();

    const div = fragment.firstChild as HTMLDivElement;
    const textNode = div.firstChild as Text;
    expect(textNode.nodeType).toBe(Node.TEXT_NODE);
    expect(textNode.data).toBe("");
  });

  it("should cache template factories", () => {
    const tree: Tree[] = [["div", null]];
    const factory1 = fromTree(tree);
    const factory2 = fromTree(tree);

    expect(factory1).toBe(factory2);
  });

  it("should return cloned fragments", () => {
    const tree: Tree[] = [["div", null]];
    const factory = fromTree(tree);
    const fragment1 = factory();
    const fragment2 = factory();

    expect(fragment1).not.toBe(fragment2);
    expect(fragment1.firstChild).not.toBe(fragment2.firstChild);
  });

  it("should create SVG elements with correct namespace", () => {
    const tree: Tree[] = [
      [
        "svg",
        { width: "100", height: "100" },
        ["circle", { cx: "50", cy: "50", r: "40" }],
      ],
    ];
    const factory = fromTree(tree, 1); // SVG namespace
    const fragment = factory();

    const svg = fragment.firstChild as SVGSVGElement;
    expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");

    const circle = svg.firstChild as SVGCircleElement;
    expect(circle.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });
});

describe("firstChild", () => {
  it("should return first child node", () => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    div.appendChild(span);

    expect(firstChild(div)).toBe(span);
  });

  it("should return first text node when isText is true", () => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    const text = document.createTextNode("hello");
    div.appendChild(span);
    div.appendChild(text);

    expect(firstChild(div, true)).toBe(text);
  });
});

describe("nextSibling", () => {
  it("should return next sibling node", () => {
    const div = document.createElement("div");
    const span1 = document.createElement("span");
    const span2 = document.createElement("span");
    div.appendChild(span1);
    div.appendChild(span2);

    expect(nextSibling(span1)).toBe(span2);
  });
});
