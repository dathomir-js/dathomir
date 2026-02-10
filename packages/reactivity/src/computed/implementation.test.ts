import { describe, expect, it, vi } from "vitest";

import { computed, effect, signal } from "../index";

describe("computed", () => {
  describe("Lazy evaluation", () => {
    it("does not call getter until .value is read", () => {
      const count = signal(1);
      const getter = vi.fn(() => count.value * 2);

      const doubled = computed(getter);

      expect(getter).not.toHaveBeenCalled();

      expect(doubled.value).toBe(2);
      expect(getter).toHaveBeenCalledTimes(1);
    });

    it("does not recompute until .value is read after dependency change", () => {
      const count = signal(1);
      const getter = vi.fn(() => count.value * 2);

      const doubled = computed(getter);

      doubled.value;
      expect(getter).toHaveBeenCalledTimes(1);

      count.set(5);
      expect(getter).toHaveBeenCalledTimes(1);

      doubled.value;
      expect(getter).toHaveBeenCalledTimes(2);
    });
  });

  describe("Caching", () => {
    it("does not recompute on second read if dependencies unchanged", () => {
      const count = signal(1);
      const getter = vi.fn(() => count.value * 2);

      const doubled = computed(getter);

      expect(doubled.value).toBe(2);
      expect(getter).toHaveBeenCalledTimes(1);

      expect(doubled.value).toBe(2);
      expect(getter).toHaveBeenCalledTimes(1);

      expect(doubled.value).toBe(2);
      expect(getter).toHaveBeenCalledTimes(1);
    });

    it("calls getter only once on first read after dependency change", () => {
      const count = signal(1);
      const getter = vi.fn(() => count.value * 2);

      const doubled = computed(getter);

      doubled.value;
      expect(getter).toHaveBeenCalledTimes(1);

      count.set(3);

      expect(doubled.value).toBe(6);
      expect(getter).toHaveBeenCalledTimes(2);

      expect(doubled.value).toBe(6);
      expect(getter).toHaveBeenCalledTimes(2);
    });
  });

  describe("Dependency tracking", () => {
    it("effect reading computed becomes dependent on computed", () => {
      const count = signal(1);
      const doubled = computed(() => count.value * 2);
      const observed: number[] = [];

      effect(() => {
        observed.push(doubled.value);
      });

      expect(observed).toEqual([2]);

      count.set(5);
      expect(observed).toEqual([2, 10]);
    });

    it("signal read inside computed becomes dependency of computed", () => {
      const a = signal(1);
      const b = signal(2);
      const sum = computed(() => a.value + b.value);

      expect(sum.value).toBe(3);

      a.set(10);
      expect(sum.value).toBe(12);

      b.set(20);
      expect(sum.value).toBe(30);
    });
  });

  describe("previousValue", () => {
    it("passes undefined on first computation", () => {
      const count = signal(1);
      const receivedPrev: (number | undefined)[] = [];

      const doubled = computed((prev?: number) => {
        receivedPrev.push(prev);
        return count.value * 2;
      });

      doubled.value;
      expect(receivedPrev).toEqual([undefined]);
    });

    it("passes previous value on subsequent computations", () => {
      const count = signal(1);
      const receivedPrev: (number | undefined)[] = [];

      const doubled = computed((prev?: number) => {
        receivedPrev.push(prev);
        return count.value * 2;
      });

      doubled.value;
      expect(receivedPrev).toEqual([undefined]);

      count.set(5);
      doubled.value;
      expect(receivedPrev).toEqual([undefined, 2]);

      count.set(10);
      doubled.value;
      expect(receivedPrev).toEqual([undefined, 2, 10]);
    });
  });

  describe("Exception handling", () => {
    it("does not corrupt state when getter throws", () => {
      const count = signal(1);
      let shouldThrow = false;

      const comp = computed(() => {
        if (shouldThrow) {
          throw new Error("getter error");
        }
        return count.value * 2;
      });

      expect(comp.value).toBe(2);

      shouldThrow = true;
      count.set(5);

      expect(() => comp.value).toThrow("getter error");

      shouldThrow = false;
      count.set(10);
      expect(comp.value).toBe(20);
    });
  });
});
