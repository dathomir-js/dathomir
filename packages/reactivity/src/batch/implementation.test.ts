import { describe, expect, it, vi } from "vitest";

import { batch, effect, signal } from "../index";

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

  it("uses only final value when updated multiple times in batch", () => {
    const count = signal(0);
    const observed: number[] = [];

    effect(() => {
      observed.push(count.value);
    });

    batch(() => {
      count.value = 1;
      count.value = 2;
      count.value = 3;
    });

    expect(observed).toEqual([0, 3]);
  });

  it("notifies only once at the end of batch", () => {
    const count = signal(0);
    const spy = vi.fn();

    effect(() => {
      spy(count.value);
    });

    expect(spy).toHaveBeenCalledTimes(1);

    batch(() => {
      count.value = 1;
      count.value = 2;
      count.value = 3;
    });

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
