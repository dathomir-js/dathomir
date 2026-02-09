import { describe, expect, it, vi } from "vitest";

import { reconcile } from "@/index";

// Helper types
type Item = { id: number; text: string };

// Helper functions
const createKeyFn = (item: Item) => item.id;
const createNodeFn = (item: Item) => {
  const li = document.createElement("li");
  li.textContent = item.text;
  li.dataset.id = String(item.id);
  return li;
};

describe("reconcile", () => {
  // ===========================================
  // Basic Operations
  // ===========================================
  describe("basic operations", () => {
    it("should create 3 items from empty array", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);

      expect(parent.children.length).toBe(3);
      expect(parent.children[0].textContent).toBe("a");
      expect(parent.children[1].textContent).toBe("b");
      expect(parent.children[2].textContent).toBe("c");
    });

    it("should remove all 3 items when going to empty array", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);
      expect(parent.children.length).toBe(3);

      reconcile(parent, [], createKeyFn, createNodeFn);
      expect(parent.children.length).toBe(0);
    });

    it("should not modify DOM when items are identical", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);
      const originalNodes = Array.from(parent.children);

      // Same items, same order
      reconcile(parent, [...items], createKeyFn, createNodeFn);

      expect(parent.children.length).toBe(3);
      expect(parent.children[0]).toBe(originalNodes[0]);
      expect(parent.children[1]).toBe(originalNodes[1]);
      expect(parent.children[2]).toBe(originalNodes[2]);
    });
  });

  // ===========================================
  // Addition
  // ===========================================
  describe("addition", () => {
    it("should add item to the end: [1,2,3] → [1,2,3,4]", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);
      const originalNodes = Array.from(parent.children);

      reconcile(
        parent,
        [...items, { id: 4, text: "d" }],
        createKeyFn,
        createNodeFn,
      );

      expect(parent.children.length).toBe(4);
      expect(parent.children[0]).toBe(originalNodes[0]);
      expect(parent.children[1]).toBe(originalNodes[1]);
      expect(parent.children[2]).toBe(originalNodes[2]);
      expect(parent.children[3].textContent).toBe("d");
    });

    it("should add item to the beginning: [1,2,3] → [0,1,2,3]", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);
      const originalNodes = Array.from(parent.children);

      reconcile(
        parent,
        [{ id: 0, text: "z" }, ...items],
        createKeyFn,
        createNodeFn,
      );

      expect(parent.children.length).toBe(4);
      expect(parent.children[0].textContent).toBe("z");
      expect(parent.children[1]).toBe(originalNodes[0]);
      expect(parent.children[2]).toBe(originalNodes[1]);
      expect(parent.children[3]).toBe(originalNodes[2]);
    });

    it("should add item in the middle: [1,2,3] → [1,1.5,2,3]", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);
      const originalNodes = Array.from(parent.children);

      reconcile(
        parent,
        [
          { id: 1, text: "a" },
          { id: 15, text: "x" },
          { id: 2, text: "b" },
          { id: 3, text: "c" },
        ],
        createKeyFn,
        createNodeFn,
      );

      expect(parent.children.length).toBe(4);
      expect(parent.children[0]).toBe(originalNodes[0]);
      expect(parent.children[1].textContent).toBe("x");
      expect(parent.children[2]).toBe(originalNodes[1]);
      expect(parent.children[3]).toBe(originalNodes[2]);
    });
  });

  // ===========================================
  // Deletion
  // ===========================================
  describe("deletion", () => {
    it("should remove item from the end: [1,2,3] → [1,2]", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);
      const originalNodes = Array.from(parent.children);

      reconcile(
        parent,
        [
          { id: 1, text: "a" },
          { id: 2, text: "b" },
        ],
        createKeyFn,
        createNodeFn,
      );

      expect(parent.children.length).toBe(2);
      expect(parent.children[0]).toBe(originalNodes[0]);
      expect(parent.children[1]).toBe(originalNodes[1]);
    });

    it("should remove item from the beginning: [1,2,3] → [2,3]", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);
      const originalNodes = Array.from(parent.children);

      reconcile(
        parent,
        [
          { id: 2, text: "b" },
          { id: 3, text: "c" },
        ],
        createKeyFn,
        createNodeFn,
      );

      expect(parent.children.length).toBe(2);
      expect(parent.children[0]).toBe(originalNodes[1]);
      expect(parent.children[1]).toBe(originalNodes[2]);
    });

    it("should remove item from the middle: [1,2,3] → [1,3]", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);
      const originalNodes = Array.from(parent.children);

      reconcile(
        parent,
        [
          { id: 1, text: "a" },
          { id: 3, text: "c" },
        ],
        createKeyFn,
        createNodeFn,
      );

      expect(parent.children.length).toBe(2);
      expect(parent.children[0]).toBe(originalNodes[0]);
      expect(parent.children[1]).toBe(originalNodes[2]);
    });
  });

  // ===========================================
  // Keyed Mode
  // ===========================================
  describe("keyed mode", () => {
    it("should reuse DOM nodes when reversing order: [a,b,c] → [c,b,a]", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);
      const originalNodes = Array.from(parent.children);

      reconcile(
        parent,
        [
          { id: 3, text: "c" },
          { id: 2, text: "b" },
          { id: 1, text: "a" },
        ],
        createKeyFn,
        createNodeFn,
      );

      expect(parent.children.length).toBe(3);
      expect(parent.children[0]).toBe(originalNodes[2]); // c
      expect(parent.children[1]).toBe(originalNodes[1]); // b
      expect(parent.children[2]).toBe(originalNodes[0]); // a
    });

    it("should reuse DOM nodes when deleting middle item: [a,b,c] → [a,c]", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);
      const originalNodes = Array.from(parent.children);

      reconcile(
        parent,
        [
          { id: 1, text: "a" },
          { id: 3, text: "c" },
        ],
        createKeyFn,
        createNodeFn,
      );

      expect(parent.children.length).toBe(2);
      expect(parent.children[0]).toBe(originalNodes[0]); // a
      expect(parent.children[1]).toBe(originalNodes[2]); // c
    });

    it("should keep existing nodes when inserting in the middle: [a,b] → [a,x,b]", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
      ];

      reconcile(parent, items, createKeyFn, createNodeFn);
      const originalNodes = Array.from(parent.children);

      reconcile(
        parent,
        [
          { id: 1, text: "a" },
          { id: 99, text: "x" },
          { id: 2, text: "b" },
        ],
        createKeyFn,
        createNodeFn,
      );

      expect(parent.children.length).toBe(3);
      expect(parent.children[0]).toBe(originalNodes[0]); // a
      expect(parent.children[1].textContent).toBe("x"); // x (new)
      expect(parent.children[2]).toBe(originalNodes[1]); // b
    });
  });

  // ===========================================
  // Unkeyed Mode
  // ===========================================
  describe("unkeyed mode", () => {
    it("should update all nodes when reversing order: [1,2,3] → [3,2,1]", () => {
      const parent = document.createElement("ul");
      const items = [1, 2, 3];
      const createFn = (item: number) => {
        const li = document.createElement("li");
        li.textContent = String(item);
        return li;
      };
      const updateFn = vi.fn((node: Node, item: number) => {
        (node as HTMLElement).textContent = String(item);
      });

      // Unkeyed mode: keyFn is undefined
      reconcile(parent, items, undefined, createFn, updateFn);
      const originalNodes = Array.from(parent.children);

      reconcile(parent, [3, 2, 1], undefined, createFn, updateFn);

      expect(parent.children.length).toBe(3);
      // In unkeyed mode, nodes are reused but content is updated
      expect(parent.children[0]).toBe(originalNodes[0]);
      expect(parent.children[1]).toBe(originalNodes[1]);
      expect(parent.children[2]).toBe(originalNodes[2]);
      expect(parent.children[0].textContent).toBe("3");
      expect(parent.children[1].textContent).toBe("2");
      expect(parent.children[2].textContent).toBe("1");
    });

    it("should reuse and update existing nodes: [a,b,c] → [x,y,z]", () => {
      const parent = document.createElement("ul");
      const items = ["a", "b", "c"];
      const createFn = (item: string) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      };
      const updateFn = vi.fn((node: Node, item: string) => {
        (node as HTMLElement).textContent = item;
      });

      reconcile(parent, items, undefined, createFn, updateFn);
      const originalNodes = Array.from(parent.children);

      reconcile(parent, ["x", "y", "z"], undefined, createFn, updateFn);

      expect(parent.children.length).toBe(3);
      // Nodes are reused in unkeyed mode
      expect(parent.children[0]).toBe(originalNodes[0]);
      expect(parent.children[1]).toBe(originalNodes[1]);
      expect(parent.children[2]).toBe(originalNodes[2]);
      // Content is updated via updateFn
      expect(parent.children[0].textContent).toBe("x");
      expect(parent.children[1].textContent).toBe("y");
      expect(parent.children[2].textContent).toBe("z");
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  describe("edge cases", () => {
    it("should call updateFn only for existing nodes", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
      ];
      const createFn = vi.fn(createNodeFn);
      const updateFn = vi.fn((node: Node, item: Item) => {
        (node as HTMLElement).textContent = item.text;
      });

      // Initial render
      reconcile(parent, items, createKeyFn, createFn, updateFn);
      expect(createFn).toHaveBeenCalledTimes(2);
      expect(updateFn).toHaveBeenCalledTimes(0);

      createFn.mockClear();
      updateFn.mockClear();

      // Update existing items (should only call updateFn)
      reconcile(
        parent,
        [
          { id: 1, text: "a-updated" },
          { id: 2, text: "b-updated" },
        ],
        createKeyFn,
        createFn,
        updateFn,
      );

      expect(createFn).toHaveBeenCalledTimes(0);
      expect(updateFn).toHaveBeenCalledTimes(2);
    });

    it("should call createFn only for new nodes", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [{ id: 1, text: "a" }];
      const createFn = vi.fn(createNodeFn);
      const updateFn = vi.fn((node: Node, item: Item) => {
        (node as HTMLElement).textContent = item.text;
      });

      reconcile(parent, items, createKeyFn, createFn, updateFn);
      expect(createFn).toHaveBeenCalledTimes(1);

      createFn.mockClear();
      updateFn.mockClear();

      // Add a new item
      reconcile(
        parent,
        [
          { id: 1, text: "a" },
          { id: 2, text: "b" },
        ],
        createKeyFn,
        createFn,
        updateFn,
      );

      // createFn called only for new item
      expect(createFn).toHaveBeenCalledTimes(1);
      expect(createFn).toHaveBeenCalledWith({ id: 2, text: "b" }, 1);
      // updateFn called for existing item
      expect(updateFn).toHaveBeenCalledTimes(1);
    });

    it("should warn on duplicate keys in development mode", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 1, text: "duplicate" }, // Duplicate key
        { id: 2, text: "b" },
      ];

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      reconcile(parent, items, createKeyFn, createNodeFn);

      // Check if warning is logged
      // Implementation may vary based on __DEV__ flag
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should pass correct index to createFn", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
        { id: 3, text: "c" },
      ];
      const createFn = vi.fn((item: Item, index: number) => {
        const li = document.createElement("li");
        li.textContent = item.text;
        li.dataset.index = String(index);
        return li;
      });

      reconcile(parent, items, createKeyFn, createFn);

      expect(createFn).toHaveBeenCalledWith({ id: 1, text: "a" }, 0);
      expect(createFn).toHaveBeenCalledWith({ id: 2, text: "b" }, 1);
      expect(createFn).toHaveBeenCalledWith({ id: 3, text: "c" }, 2);
    });

    it("should pass correct index to updateFn", () => {
      const parent = document.createElement("ul");
      const items: Item[] = [
        { id: 1, text: "a" },
        { id: 2, text: "b" },
      ];
      const updateFn = vi.fn(
        (node: Node, item: Item, index: number): void => {},
      );

      reconcile(parent, items, createKeyFn, createNodeFn, updateFn);

      // Reorder items
      reconcile(
        parent,
        [
          { id: 2, text: "b" },
          { id: 1, text: "a" },
        ],
        createKeyFn,
        createNodeFn,
        updateFn,
      );

      // updateFn should receive updated indices
      expect(updateFn).toHaveBeenCalledWith(
        expect.any(Node),
        { id: 2, text: "b" },
        0,
      );
      expect(updateFn).toHaveBeenCalledWith(
        expect.any(Node),
        { id: 1, text: "a" },
        1,
      );
    });
  });

  // ===========================================
  // Legacy tests (preserved from original)
  // ===========================================
  describe("legacy tests", () => {
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
});
