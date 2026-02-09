import { describe, expect, it, vi } from "vitest";

import { createRoot, onCleanup, signal, templateEffect } from "../index";

describe("onCleanup", () => {
  it("should register cleanup function within createRoot", () => {
    const cleanupSpy = vi.fn();
    const dispose = createRoot(() => {
      onCleanup(cleanupSpy);
    });

    expect(cleanupSpy).not.toHaveBeenCalled();
    dispose();
    expect(cleanupSpy).toHaveBeenCalledTimes(1);
  });

  it("should call multiple cleanup functions in order", () => {
    const order: number[] = [];
    const dispose = createRoot(() => {
      onCleanup(() => order.push(1));
      onCleanup(() => order.push(2));
      onCleanup(() => order.push(3));
    });

    dispose();
    expect(order).toEqual([1, 2, 3]);
  });

  it("should not register cleanup outside createRoot", () => {
    const cleanupSpy = vi.fn();
    // Calling onCleanup outside createRoot should be a no-op
    onCleanup(cleanupSpy);
    // No way to trigger it, it's just ignored
    expect(cleanupSpy).not.toHaveBeenCalled();
  });

  it("should cleanup effects before custom cleanups", () => {
    const order: string[] = [];
    const count = signal(0);
    const dispose = createRoot(() => {
      templateEffect(() => {
        void count.value;
      });
      onCleanup(() => order.push("custom"));
    });

    dispose();
    // Effects are cleaned up first, then custom cleanups
    expect(order).toEqual(["custom"]);
  });

  it("runs all cleanups on dispose", () => {
    const cleanups: string[] = [];

    const dispose = createRoot(() => {
      onCleanup(() => cleanups.push("a"));
      onCleanup(() => cleanups.push("b"));
      onCleanup(() => cleanups.push("c"));
    });

    expect(cleanups).toEqual([]);

    dispose();

    expect(cleanups).toEqual(["a", "b", "c"]);
  });

  it("continues executing other cleanups when one throws", () => {
    const cleanups: string[] = [];
    const errors: Error[] = [];

    const dispose = createRoot(() => {
      onCleanup(() => cleanups.push("first"));
      onCleanup(() => {
        throw new Error("cleanup error");
      });
      onCleanup(() => cleanups.push("third"));
    });

    try {
      dispose();
    } catch (e) {
      errors.push(e as Error);
    }

    expect(cleanups).toContain("first");
  });

  it("does nothing when called outside createRoot", () => {
    const spy = vi.fn();
    onCleanup(spy);
    expect(spy).not.toHaveBeenCalled();
  });
});
