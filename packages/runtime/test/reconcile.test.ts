import { describe, expect, it } from "vitest";

import { reconcile } from "../src/index";

describe("reconcile", () => {
  it("should create initial items", () => {
    const parent = document.createElement("ul");
    const items = [
      { id: 1, text: "a" },
      { id: 2, text: "b" },
      { id: 3, text: "c" },
    ];

    reconcile(
      parent,
      items,
      (item) => item.id,
      (item) => {
        const li = document.createElement("li");
        li.textContent = item.text;
        return li;
      },
    );

    expect(parent.children.length).toBe(3);
    expect(parent.children[0].textContent).toBe("a");
    expect(parent.children[1].textContent).toBe("b");
    expect(parent.children[2].textContent).toBe("c");
  });

  it("should add new items", () => {
    const parent = document.createElement("ul");
    const createFn = (item: { id: number; text: string }) => {
      const li = document.createElement("li");
      li.textContent = item.text;
      return li;
    };
    const keyFn = (item: { id: number }) => item.id;

    reconcile(parent, [{ id: 1, text: "a" }], keyFn, createFn);
    reconcile(
      parent,
      [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
      ],
      keyFn,
      createFn,
    );

    expect(parent.children.length).toBe(2);
    expect(parent.children[1].textContent).toBe("b");
  });

  it("should remove items", () => {
    const parent = document.createElement("ul");
    const createFn = (item: { id: number; text: string }) => {
      const li = document.createElement("li");
      li.textContent = item.text;
      return li;
    };
    const keyFn = (item: { id: number }) => item.id;

    reconcile(
      parent,
      [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
      ],
      keyFn,
      createFn,
    );
    reconcile(parent, [{ id: 1, text: "a" }], keyFn, createFn);

    expect(parent.children.length).toBe(1);
    expect(parent.children[0].textContent).toBe("a");
  });

  it("should reorder items", () => {
    const parent = document.createElement("ul");
    const createFn = (item: { id: number; text: string }) => {
      const li = document.createElement("li");
      li.textContent = item.text;
      li.dataset.id = String(item.id);
      return li;
    };
    const keyFn = (item: { id: number }) => item.id;

    reconcile(
      parent,
      [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ],
      keyFn,
      createFn,
    );

    const originalNodes = Array.from(parent.children);

    reconcile(
      parent,
      [
        { id: 3, text: "c" },
        { id: 1, text: "a" },
        { id: 2, text: "b" },
      ],
      keyFn,
      createFn,
    );

    expect(parent.children.length).toBe(3);
    expect(parent.children[0]).toBe(originalNodes[2]); // c
    expect(parent.children[1]).toBe(originalNodes[0]); // a
    expect(parent.children[2]).toBe(originalNodes[1]); // b
  });

  it("should handle empty to items", () => {
    const parent = document.createElement("ul");
    const createFn = (item: { id: number; text: string }) => {
      const li = document.createElement("li");
      li.textContent = item.text;
      return li;
    };
    const keyFn = (item: { id: number }) => item.id;

    reconcile(parent, [], keyFn, createFn);
    expect(parent.children.length).toBe(0);

    reconcile(parent, [{ id: 1, text: "a" }], keyFn, createFn);
    expect(parent.children.length).toBe(1);
  });

  it("should handle items to empty", () => {
    const parent = document.createElement("ul");
    const createFn = (item: { id: number; text: string }) => {
      const li = document.createElement("li");
      li.textContent = item.text;
      return li;
    };
    const keyFn = (item: { id: number }) => item.id;

    reconcile(
      parent,
      [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
      ],
      keyFn,
      createFn,
    );
    reconcile(parent, [], keyFn, createFn);

    expect(parent.children.length).toBe(0);
  });

  it("should reuse existing nodes", () => {
    const parent = document.createElement("ul");
    const createFn = (item: { id: number; text: string }) => {
      const li = document.createElement("li");
      li.textContent = item.text;
      return li;
    };
    const keyFn = (item: { id: number }) => item.id;

    reconcile(parent, [{ id: 1, text: "a" }], keyFn, createFn);
    const originalNode = parent.firstChild;

    reconcile(parent, [{ id: 1, text: "a" }], keyFn, createFn);
    expect(parent.firstChild).toBe(originalNode);
  });
});
