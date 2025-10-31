import { describe, it, expect } from "vitest";
import { signal, computed, toUnreactive } from "../src/index";

describe("toUnreactive", () => {
  describe("primitive values", () => {
    it("should return primitives unchanged", () => {
      expect(toUnreactive(null)).toBe(null);
      expect(toUnreactive(undefined)).toBe(undefined);
      expect(toUnreactive(42)).toBe(42);
      expect(toUnreactive("hello")).toBe("hello");
      expect(toUnreactive(true)).toBe(true);
      expect(toUnreactive(false)).toBe(false);
      expect(toUnreactive(BigInt(123))).toBe(BigInt(123));
      const sym = Symbol("test");
      expect(toUnreactive(sym)).toBe(sym);
    });

    it("should return functions unchanged", () => {
      const fn = () => 42;
      expect(toUnreactive(fn)).toBe(fn);
    });
  });

  describe("signal unwrapping", () => {
    it("should unwrap signal to its value", () => {
      const count = signal(42);
      expect(toUnreactive(count)).toBe(42);
    });

    it("should unwrap signal with string value", () => {
      const name = signal("Alice");
      expect(toUnreactive(name)).toBe("Alice");
    });

    it("should unwrap signal with object value", () => {
      const obj = signal({ x: 1, y: 2 });
      expect(toUnreactive(obj)).toEqual({ x: 1, y: 2 });
    });
  });

  describe("computed unwrapping", () => {
    it("should unwrap computed to its value", () => {
      const count = signal(10);
      const doubled = computed(() => count.value * 2);
      expect(toUnreactive(doubled)).toBe(20);
    });

    it("should unwrap computed with dependent signals", () => {
      const a = signal(5);
      const b = signal(3);
      const sum = computed(() => a.value + b.value);
      expect(toUnreactive(sum)).toBe(8);
    });

    it("should unwrap nested computed", () => {
      const base = signal(2);
      const squared = computed(() => base.value ** 2);
      const cubed = computed(() => squared.value * base.value);
      expect(toUnreactive(cubed)).toBe(8);
    });
  });

  describe("array unwrapping", () => {
    it("should unwrap array with primitives", () => {
      expect(toUnreactive([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it("should unwrap array with signals", () => {
      const arr = [signal(1), signal(2), signal(3)];
      expect(toUnreactive(arr)).toEqual([1, 2, 3]);
    });

    it("should unwrap array with mixed values", () => {
      const count = signal(42);
      const doubled = computed(() => count.value * 2);
      const arr = [1, count, "test", doubled, null];
      expect(toUnreactive(arr)).toEqual([1, 42, "test", 84, null]);
    });

    it("should preserve array holes (sparse arrays)", () => {
      const arr = [1, , 3]; // eslint-disable-line no-sparse-arrays
      const result = toUnreactive(arr);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(1);
      expect(result[1]).toBeUndefined();
      expect(result[2]).toBe(3);
    });
  });

  describe("object unwrapping", () => {
    it("should unwrap plain object with primitives", () => {
      const obj = { a: 1, b: "test", c: true };
      expect(toUnreactive(obj)).toEqual({ a: 1, b: "test", c: true });
    });

    it("should unwrap object with signals", () => {
      const obj = {
        count: signal(42),
        name: signal("Alice"),
      };
      expect(toUnreactive(obj)).toEqual({
        count: 42,
        name: "Alice",
      });
    });

    it("should unwrap object with computed", () => {
      const count = signal(10);
      const obj = {
        count,
        doubled: computed(() => count.value * 2),
        tripled: computed(() => count.value * 3),
      };
      expect(toUnreactive(obj)).toEqual({
        count: 10,
        doubled: 20,
        tripled: 30,
      });
    });

    it("should not copy non-enumerable properties", () => {
      const obj = { visible: signal(1) };
      Object.defineProperty(obj, "hidden", {
        value: signal(2),
        enumerable: false,
      });
      const result = toUnreactive(obj);
      expect(result).toEqual({ visible: 1 });
      expect(result).not.toHaveProperty("hidden");
    });
  });

  describe("nested structure unwrapping", () => {
    it("should unwrap deeply nested objects", () => {
      const count = signal(42);
      const obj = {
        level1: {
          level2: {
            level3: {
              count,
            },
          },
        },
      };
      expect(toUnreactive(obj)).toEqual({
        level1: {
          level2: {
            level3: {
              count: 42,
            },
          },
        },
      });
    });

    it("should unwrap nested arrays", () => {
      const s1 = signal(1);
      const s2 = signal(2);
      const arr = [[s1], [s2, [signal(3)]]];
      expect(toUnreactive(arr)).toEqual([[1], [2, [3]]]);
    });

    it("should unwrap mixed nested structures", () => {
      const count = signal(5);
      const data = {
        users: [
          { id: signal(1), name: "Alice" },
          { id: signal(2), name: computed(() => "Bob" + count.value) },
        ],
        meta: {
          total: computed(() => count.value * 2),
          active: signal(true),
        },
      };
      expect(toUnreactive(data)).toEqual({
        users: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob5" },
        ],
        meta: {
          total: 10,
          active: true,
        },
      });
    });
  });

  describe("circular reference handling", () => {
    it("should handle circular object reference without onCircular", () => {
      const obj: any = { name: signal("test") };
      obj.self = obj;

      const result = toUnreactive(obj);
      expect(result.name).toBe("test");
      expect(result.self).toBe(result); // Should be same reference
    });

    it("should handle circular object reference with onCircular", () => {
      const obj: any = { name: signal("test") };
      obj.self = obj;

      const result = toUnreactive(obj, {
        onCircular: () => "[Circular]",
      });
      expect(result.name).toBe("test");
      expect(result.self).toBe("[Circular]");
    });

    it("should handle circular array reference", () => {
      const arr: any[] = [signal(1), signal(2)];
      arr.push(arr);

      const result = toUnreactive(arr, {
        onCircular: () => "[Circular]",
      });
      expect(result).toEqual([1, 2, "[Circular]"]);
    });

    it("should handle indirect circular references", () => {
      const a: any = { name: signal("A") };
      const b: any = { name: signal("B"), ref: a };
      a.ref = b;

      const result = toUnreactive(a, {
        onCircular: () => "[Circular]",
      });
      expect(result.name).toBe("A");
      expect(result.ref.name).toBe("B");
      expect(result.ref.ref).toBe("[Circular]");
    });
  });

  describe("depth limit handling", () => {
    it("should respect maxDepth option", () => {
      const deep = {
        l1: {
          l2: {
            l3: signal(42),
          },
        },
      };

      const result = toUnreactive(deep, { maxDepth: 1 });
      expect(result.l1.l2.l3).toHaveProperty("__type__", "signal");
    });

    it("should stop unwrapping at maxDepth", () => {
      const count = signal(100);
      const nested = {
        a: {
          b: {
            c: count,
          },
        },
      };

      const result = toUnreactive(nested, { maxDepth: 2 });
      expect(result.a.b.c).toHaveProperty("__type__", "signal");
    });

    it("should unwrap at depth 0 with maxDepth 0", () => {
      const count = signal(42);
      const result = toUnreactive(count, { maxDepth: 0 });
      // maxDepth 0 means we can't go deeper, but we're already at depth 0
      // so the signal itself should be unwrapped
      expect(result).toBe(42);
    });
  });

  describe("special object types", () => {
    it("should return Date unchanged", () => {
      const date = new Date("2025-01-01");
      const result = toUnreactive(date);
      expect(result).toBe(date);
    });

    it("should return RegExp unchanged", () => {
      const regex = /test/g;
      const result = toUnreactive(regex);
      expect(result).toBe(regex);
    });

    it("should return Map unchanged", () => {
      const map = new Map([["key", signal(1)]]);
      const result = toUnreactive(map);
      expect(result).toBe(map);
    });

    it("should return Set unchanged", () => {
      const set = new Set([signal(1), signal(2)]);
      const result = toUnreactive(set);
      expect(result).toBe(set);
    });
  });

  describe("error handling", () => {
    it("should return original reactive if peek() throws", () => {
      const failing = {
        __type__: "computed" as const,
        peek: () => {
          throw new Error("Computation failed");
        },
      };

      const result = toUnreactive(failing);
      expect(result).toBe(failing);
    });
  });

  describe("VNode-like structures", () => {
    it("should unwrap VNode-like object with reactive props", () => {
      const count = signal(42);
      const vnode = {
        t: "div",
        p: {
          class: "container",
          title: computed(() => `Count: ${count.value}`),
        },
        c: [count],
      };

      const result = toUnreactive(vnode);
      expect(result).toEqual({
        t: "div",
        p: {
          class: "container",
          title: "Count: 42",
        },
        c: [42],
      });
    });

    it("should unwrap deeply nested VNode children", () => {
      const count = signal(5);
      const vnode = {
        t: "div",
        p: {},
        c: [
          {
            t: "span",
            p: { title: count },
            c: [computed(() => count.value * 2)],
          },
        ],
      };

      const result = toUnreactive(vnode);
      expect(result).toEqual({
        t: "div",
        p: {},
        c: [
          {
            t: "span",
            p: { title: 5 },
            c: [10],
          },
        ],
      });
    });
  });
});
