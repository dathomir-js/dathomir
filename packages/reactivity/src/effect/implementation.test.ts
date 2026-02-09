import { describe, expect, it } from "vitest";

import { computed, effect, signal } from "../index";

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

  it("handles multiple consecutive changes correctly", () => {
    const count = signal(0);
    const doubleCount = computed(() => count.value * 2);

    const observed: number[] = [];

    effect(() => {
      observed.push(doubleCount.value);
    });

    count.set(1);
    count.set(2);

    expect(observed).toEqual([0, 2, 4]);
  });
});
