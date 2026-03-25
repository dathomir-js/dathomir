import { describe, expect, it, vi } from "vitest";

import { append, insert } from "./implementation";

describe("append", () => {
  it("should append a child to a parent", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");

    append(parent, child);

    expect(parent.childNodes.length).toBe(1);
    expect(parent.firstChild).toBe(child);
  });

  it("should append multiple children", () => {
    const parent = document.createElement("div");
    const child1 = document.createElement("span");
    const child2 = document.createElement("p");

    append(parent, child1);
    append(parent, child2);

    expect(parent.childNodes.length).toBe(2);
    expect(parent.childNodes[0]).toBe(child1);
    expect(parent.childNodes[1]).toBe(child2);
  });

  it("should append a text node", () => {
    const parent = document.createElement("div");
    const text = document.createTextNode("hello");

    append(parent, text);

    expect(parent.textContent).toBe("hello");
  });
});

describe("insert", () => {
  it("should insert a child before an anchor", () => {
    const parent = document.createElement("div");
    const anchor = document.createComment("anchor");
    parent.appendChild(anchor);

    const child = document.createElement("span");
    insert(parent, child, anchor);

    expect(parent.childNodes.length).toBe(2);
    expect(parent.firstChild).toBe(child);
    expect(parent.lastChild).toBe(anchor);
  });

  it("should append when anchor is null", () => {
    const parent = document.createElement("div");
    const existing = document.createElement("p");
    parent.appendChild(existing);

    const child = document.createElement("span");
    insert(parent, child, null);

    expect(parent.childNodes.length).toBe(2);
    expect(parent.lastChild).toBe(child);
  });

  it("should insert a DocumentFragment", () => {
    const parent = document.createElement("div");
    const anchor = document.createComment("anchor");
    parent.appendChild(anchor);

    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createElement("span"));
    fragment.appendChild(document.createElement("p"));

    insert(parent, fragment, anchor);

    expect(parent.childNodes.length).toBe(3);
    expect((parent.childNodes[0] as Element).tagName).toBe("SPAN");
    expect((parent.childNodes[1] as Element).tagName).toBe("P");
  });

  it("should insert from a factory function", () => {
    const parent = document.createElement("div");
    const anchor = document.createComment("anchor");
    parent.appendChild(anchor);

    const factory = () => {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createElement("div"));
      return frag;
    };

    insert(parent, factory, anchor);

    expect(parent.childNodes.length).toBe(2);
    expect((parent.childNodes[0] as Element).tagName).toBe("DIV");
  });

  it("should insert iterable children containing a DocumentFragment", () => {
    const parent = document.createElement("div");
    const anchor = document.createComment("anchor");
    parent.appendChild(anchor);

    const fragment = document.createDocumentFragment();
    const span = document.createElement("span");
    span.textContent = "child";
    fragment.appendChild(span);

    insert(parent, [fragment] as unknown, anchor);

    expect(parent.childNodes.length).toBe(2);
    expect((parent.childNodes[0] as Element).tagName).toBe("SPAN");
    expect(parent.textContent).toBe("child");
  });

  it("should insert iterable children with mixed node and text values", () => {
    const parent = document.createElement("div");
    const anchor = document.createComment("anchor");
    parent.appendChild(anchor);

    const span = document.createElement("span");
    span.textContent = "A";

    insert(parent, [span, "B", 3, null, false] as unknown, anchor);

    expect(parent.childNodes.length).toBe(4);
    expect((parent.childNodes[0] as Element).tagName).toBe("SPAN");
    expect(parent.childNodes[1]?.textContent).toBe("B");
    expect(parent.childNodes[2]?.textContent).toBe("3");
  });

  it("should clean up previous inserted content on re-insert", () => {
    const parent = document.createElement("div");
    const anchor = document.createComment("anchor");
    parent.appendChild(anchor);

    const child1 = document.createElement("span");
    insert(parent, child1, anchor);
    expect(parent.childNodes.length).toBe(2);

    const child2 = document.createElement("p");
    insert(parent, child2, anchor);
    expect(parent.childNodes.length).toBe(2);
    expect((parent.childNodes[0] as Element).tagName).toBe("P");
  });

  it("should remove SSR content after hydration anchors on first insert", () => {
    const parent = document.createElement("div");
    const anchor = document.createComment("dh:i:0");
    const ssrText = document.createTextNode("server rendered");
    const endMarker = document.createComment("/dh:i");
    const nextMarker = document.createComment("dh:t:1");
    parent.append(anchor, ssrText, endMarker, nextMarker);

    const child = document.createElement("span");
    child.textContent = "client";
    insert(parent, child, anchor);

    expect(parent.textContent).toBe("client");
    expect(parent.contains(ssrText)).toBe(false);
    expect(parent.contains(endMarker)).toBe(false);
    expect(parent.childNodes[0]).toBe(child);
    expect(parent.childNodes[1]).toBe(anchor);
    expect(parent.childNodes[2]).toBe(nextMarker);
  });

  it("should preserve sibling template nodes for CSR anchors on first insert", () => {
    const parent = document.createElement("div");
    const anchor = document.createComment("{insert}");
    const staticSibling = document.createElement("strong");
    staticSibling.textContent = "static";
    parent.append(anchor, staticSibling);

    const child = document.createElement("span");
    child.textContent = "client";
    insert(parent, child, anchor);

    expect(parent.childNodes[0]).toBe(child);
    expect(parent.childNodes[1]).toBe(anchor);
    expect(parent.childNodes[2]).toBe(staticSibling);
    expect(staticSibling.textContent).toBe("static");
  });

  it("should convert unknown types to text nodes", () => {
    const parent = document.createElement("div");
    const anchor = document.createComment("anchor");
    parent.appendChild(anchor);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    insert(parent, 42 as unknown, anchor);

    expect(parent.childNodes.length).toBe(2);
    expect(parent.childNodes[0].textContent).toBe("42");
    expect(errorSpy).toHaveBeenCalledWith(
      "[insert] Unexpected child type:",
      "number",
      42,
    );

    errorSpy.mockRestore();
  });

  it("should clean up SSR content on first insert, then use WeakMap on re-insert", () => {
    const parent = document.createElement("div");
    const anchor = document.createComment("dh:i:0");
    const ssrText = document.createTextNode("server rendered");
    const endMarker = document.createComment("/dh:i");
    const nextMarker = document.createComment("dh:t:1");
    parent.append(anchor, ssrText, endMarker, nextMarker);

    // First insert: SSR cleanup removes ssrText between dh: markers
    const child1 = document.createElement("span");
    child1.textContent = "first";
    insert(parent, child1, anchor);

    expect(parent.contains(ssrText)).toBe(false);
    expect(parent.contains(endMarker)).toBe(false);
    expect(parent.childNodes[0]).toBe(child1);
    expect(parent.childNodes[1]).toBe(anchor);
    expect(parent.childNodes[2]).toBe(nextMarker);

    // Second insert: WeakMap-based cleanup removes child1
    const child2 = document.createElement("p");
    child2.textContent = "second";
    insert(parent, child2, anchor);

    expect(parent.contains(child1)).toBe(false);
    expect(parent.childNodes[0]).toBe(child2);
    expect(parent.childNodes[1]).toBe(anchor);
    expect(parent.childNodes[2]).toBe(nextMarker);
  });

  it("should no-op when parent is null", () => {
    vi.stubGlobal("__DEV__", true);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => {
      insert(null as unknown as Node, document.createTextNode("x"), null);
    }).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
