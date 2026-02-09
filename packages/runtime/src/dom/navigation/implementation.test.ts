import { describe, expect, it } from "vitest";

import { firstChild, nextSibling } from "@/index";

describe("firstChild", () => {
  it("should return first child element", () => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    div.appendChild(span);

    expect(firstChild(div)).toBe(span);
  });

  it("should return first text node when isText is true", () => {
    const div = document.createElement("div");
    const text = document.createTextNode("hello");
    div.appendChild(text);

    expect(firstChild(div, true)).toBe(text);
  });

  it("should skip element nodes and return text node when isText is true", () => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    const text = document.createTextNode("hello");
    div.appendChild(span);
    div.appendChild(text);

    // When isText is true, it should find the text node
    expect(firstChild(div, true)).toBe(text);
  });

  it("should return null when there are no children", () => {
    const div = document.createElement("div");
    expect(firstChild(div)).toBeNull();
  });

  it("should return text node as first child when it exists", () => {
    const div = document.createElement("div");
    const text = document.createTextNode("hello");
    const span = document.createElement("span");
    div.appendChild(text);
    div.appendChild(span);

    // Without isText flag, firstChild returns the first child regardless of type
    expect(firstChild(div)).toBe(text);
  });

  it("should handle empty text nodes", () => {
    const div = document.createElement("div");
    const emptyText = document.createTextNode("");
    div.appendChild(emptyText);

    expect(firstChild(div)).toBe(emptyText);
    expect(firstChild(div, true)).toBe(emptyText);
  });

  it("should handle comment nodes", () => {
    const div = document.createElement("div");
    const comment = document.createComment("marker");
    div.appendChild(comment);

    expect(firstChild(div)).toBe(comment);
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

  it("should return null when there is no next sibling", () => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    div.appendChild(span);

    expect(nextSibling(span)).toBeNull();
  });

  it("should return text node as next sibling", () => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    const text = document.createTextNode("hello");
    div.appendChild(span);
    div.appendChild(text);

    expect(nextSibling(span)).toBe(text);
  });

  it("should return comment node as next sibling", () => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    const comment = document.createComment("marker");
    div.appendChild(span);
    div.appendChild(comment);

    expect(nextSibling(span)).toBe(comment);
  });

  it("should chain multiple siblings correctly", () => {
    const div = document.createElement("div");
    const span1 = document.createElement("span");
    const span2 = document.createElement("span");
    const span3 = document.createElement("span");
    div.appendChild(span1);
    div.appendChild(span2);
    div.appendChild(span3);

    expect(nextSibling(span1)).toBe(span2);
    expect(nextSibling(span2)).toBe(span3);
    expect(nextSibling(span3)).toBeNull();
  });
});

describe("navigation combination", () => {
  it("should get second child using nextSibling(firstChild(parent))", () => {
    const parent = document.createElement("div");
    const first = document.createElement("span");
    const second = document.createElement("p");
    parent.appendChild(first);
    parent.appendChild(second);

    const result = nextSibling(firstChild(parent)!);
    expect(result).toBe(second);
  });

  it("should navigate through mixed node types", () => {
    const parent = document.createElement("div");
    const element = document.createElement("span");
    const text = document.createTextNode("hello");
    const comment = document.createComment("marker");
    parent.appendChild(element);
    parent.appendChild(text);
    parent.appendChild(comment);

    expect(firstChild(parent)).toBe(element);
    expect(nextSibling(element)).toBe(text);
    expect(nextSibling(text)).toBe(comment);
  });

  it("should find nested element using firstChild chain", () => {
    const grandparent = document.createElement("div");
    const parent = document.createElement("section");
    const child = document.createElement("span");
    grandparent.appendChild(parent);
    parent.appendChild(child);

    const result = firstChild(firstChild(grandparent)!);
    expect(result).toBe(child);
  });
});
