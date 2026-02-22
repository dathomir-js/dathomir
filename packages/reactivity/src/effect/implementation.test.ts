import { describe, expect, it, vi } from "vitest";

import { computed, effect, onCleanup, signal } from "../index";

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

describe("effect onCleanup integration", () => {
  it("onCleanup registered in effect runs before re-execution", () => {
    const count = signal(0);
    const log: string[] = [];

    effect(() => {
      const v = count.value;
      log.push(`run:${v}`);
      onCleanup(() => log.push(`cleanup:${v}`));
    });

    count.set(1);
    count.set(2);

    expect(log).toEqual([
      "run:0",
      "cleanup:0",
      "run:1",
      "cleanup:1",
      "run:2",
    ]);
  });

  it("onCleanup registered in effect runs when stop() is called", () => {
    const cleanupSpy = vi.fn();
    const count = signal(0);

    const stop = effect(() => {
      void count.value;
      onCleanup(cleanupSpy);
    });

    expect(cleanupSpy).not.toHaveBeenCalled();
    stop();
    expect(cleanupSpy).toHaveBeenCalledTimes(1);
  });

  it("multiple onCleanup calls in effect run in order", () => {
    const order: number[] = [];
    const count = signal(0);

    const stop = effect(() => {
      void count.value;
      onCleanup(() => order.push(1));
      onCleanup(() => order.push(2));
      onCleanup(() => order.push(3));
    });

    stop();
    expect(order).toEqual([1, 2, 3]);
  });

  it("re-execution replaces previous onCleanup with new ones", () => {
    const count = signal(0);
    const log: string[] = [];

    const stop = effect(() => {
      const v = count.value;
      onCleanup(() => log.push(`cleanup:${v}`));
    });

    count.set(1); // cleanup:0 runs, then new cleanup:1 is registered
    stop();       // cleanup:1 runs

    expect(log).toEqual(["cleanup:0", "cleanup:1"]);
  });
});
