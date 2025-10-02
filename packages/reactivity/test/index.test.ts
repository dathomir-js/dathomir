import { describe, expect, it, vi } from "vitest";

import { batch, computed, effect, signal } from "../src/index.js";

describe("signal", () => {
  it("updates via value setter and functional set", () => {
    const count = signal(0);

    expect(count.value).toBe(0);

    count.set(1);
    expect(count.value).toBe(1);

    count.set((prev) => prev + 2);
    expect(count.value).toBe(3);

    count.update((prev) => prev * 2);
    expect(count.value).toBe(6);
  });
});

describe("computed", () => {
  it("is lazy and caches until dependencies change", () => {
    const count = signal(1);
    const getter = vi.fn(() => count.value * 2);

    const doubled = computed(getter);

    expect(getter).not.toHaveBeenCalled();

    expect(doubled.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(1);

    expect(doubled.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(1);

    count.set(3);

    expect(doubled.value).toBe(6);
    expect(getter).toHaveBeenCalledTimes(2);
  });
});

describe("effect", () => {
  it("reacts to changes and cleanup stops re-execution", () => {
    const count = signal(0);
    const observed: number[] = [];

    const stop = effect(() => {
      observed.push(count.value);
    });

    expect(observed).toEqual([0]);

    count.set(1);
    expect(observed).toEqual([0, 1]);

    stop();

    count.set(2);
    expect(observed).toEqual([0, 1]);
  });

  it("peek reads without tracking dependencies", () => {
    const count = signal(0);
    const observed: number[] = [];

    effect(() => {
      observed.push(count.peek());
    });

    expect(observed).toEqual([0]);

    count.set(1);

    expect(observed).toEqual([0]);
  });
});

describe("batch", () => {
  it("groups multiple updates into a single notification", () => {
    const count = signal(0);
    const observed: number[] = [];

    effect(() => {
      observed.push(count.value);
    });

    expect(observed).toEqual([0]);

    batch(() => {
      count.set(1);
      count.set(2);
    });

    expect(observed).toEqual([0, 2]);
  });
});
