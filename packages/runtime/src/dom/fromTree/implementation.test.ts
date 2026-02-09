import { describe, expect, it } from "vitest";

import { fromTree } from "@/index";
import type { Tree } from "@/types/tree";

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

  it("should create placeholder text nodes for {text}", () => {
    const tree: Tree[] = [["div", null, ["{text}", null]]];
    const factory = fromTree(tree);
    const fragment = factory();

    const div = fragment.firstChild as HTMLDivElement;
    const textNode = div.firstChild as Text;
    expect(textNode.nodeType).toBe(Node.TEXT_NODE);
    expect(textNode.data).toBe("");
  });

  it("should create comment nodes for {insert} placeholder", () => {
    const tree: Tree[] = [["div", null, ["{insert}", null]]];
    const factory = fromTree(tree);
    const fragment = factory();

    const div = fragment.firstChild as HTMLDivElement;
    const comment = div.firstChild as Comment;
    expect(comment.nodeType).toBe(Node.COMMENT_NODE);
  });

  it("should handle empty array", () => {
    const tree: Tree[] = [];
    const factory = fromTree(tree);
    const fragment = factory();

    expect(fragment).toBeInstanceOf(DocumentFragment);
    expect(fragment.childNodes.length).toBe(0);
  });

  it("should handle mixed children with placeholders", () => {
    const tree: Tree[] = [["div", null, "Hello ", ["{text}", null], " World"]];
    const factory = fromTree(tree);
    const fragment = factory();

    const div = fragment.firstChild as HTMLDivElement;
    expect(div.childNodes.length).toBe(3);
    expect((div.childNodes[0] as Text).data).toBe("Hello ");
    expect(div.childNodes[1].nodeType).toBe(Node.TEXT_NODE);
    expect((div.childNodes[1] as Text).data).toBe("");
    expect((div.childNodes[2] as Text).data).toBe(" World");
  });

  it("should handle multiple root elements", () => {
    const tree: Tree[] = [
      ["div", null],
      ["span", null],
      ["p", null],
    ];
    const factory = fromTree(tree);
    const fragment = factory();

    expect(fragment.childNodes.length).toBe(3);
    expect((fragment.childNodes[0] as HTMLElement).tagName).toBe("DIV");
    expect((fragment.childNodes[1] as HTMLElement).tagName).toBe("SPAN");
    expect((fragment.childNodes[2] as HTMLElement).tagName).toBe("P");
  });

  it("should handle deeply nested elements", () => {
    const tree: Tree[] = [
      ["div", null, ["section", null, ["article", null, ["p", null, "deep"]]]],
    ];
    const factory = fromTree(tree);
    const fragment = factory();

    const div = fragment.firstChild as HTMLElement;
    const section = div.firstChild as HTMLElement;
    const article = section.firstChild as HTMLElement;
    const p = article.firstChild as HTMLElement;
    expect(p.textContent).toBe("deep");
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
