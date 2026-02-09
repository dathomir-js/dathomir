import { describe, expect, it } from "vitest";

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

  it("should convert unknown types to text nodes", () => {
    const parent = document.createElement("div");
    const anchor = document.createComment("anchor");
    parent.appendChild(anchor);

    insert(parent, 42 as unknown, anchor);

    expect(parent.childNodes.length).toBe(2);
    expect(parent.childNodes[0].textContent).toBe("42");
  });
});
