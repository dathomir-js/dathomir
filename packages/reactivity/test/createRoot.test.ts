import { describe, expect, it, vi } from "vitest";
import {
  createRoot,
  effect,
  onCleanup,
  signal,
  templateEffect,
} from "../src/index";

describe("createRoot", () => {
  it("should return a dispose function", () => {
    const dispose = createRoot(() => {});
    expect(typeof dispose).toBe("function");
  });

  it("should track and cleanup effects created within scope", () => {
    const count = signal(0);
    const spy = vi.fn();
    let dispose: (() => void) | undefined;

    dispose = createRoot(() => {
      templateEffect(() => {
        spy(count.value);
      });
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(0);

    count.value = 1;
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(1);

    dispose();

    count.value = 2;
    // Effect should not run after dispose
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("should track multiple effects", () => {
    const count = signal(0);
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    let dispose: (() => void) | undefined;

    dispose = createRoot(() => {
      templateEffect(() => spy1(count.value));
      templateEffect(() => spy2(count.value * 2));
    });

    expect(spy1).toHaveBeenCalledWith(0);
    expect(spy2).toHaveBeenCalledWith(0);

    count.value = 5;
    expect(spy1).toHaveBeenCalledWith(5);
    expect(spy2).toHaveBeenCalledWith(10);

    dispose();

    count.value = 10;
    expect(spy1).toHaveBeenCalledTimes(2);
    expect(spy2).toHaveBeenCalledTimes(2);
  });

  it("should provide dispose function to callback", () => {
    const count = signal(0);
    const spy = vi.fn();
    let internalDispose: (() => void) | undefined;

    createRoot((dispose) => {
      internalDispose = dispose;
      templateEffect(() => spy(count.value));
    });

    count.value = 1;
    expect(spy).toHaveBeenCalledTimes(2);

    internalDispose!();

    count.value = 2;
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("should handle nested createRoot", () => {
    const count = signal(0);
    const outerSpy = vi.fn();
    const innerSpy = vi.fn();
    let outerDispose: (() => void) | undefined;
    let innerDispose: (() => void) | undefined;

    outerDispose = createRoot(() => {
      templateEffect(() => outerSpy(count.value));

      innerDispose = createRoot(() => {
        templateEffect(() => innerSpy(count.value));
      });
    });

    count.value = 1;
    expect(outerSpy).toHaveBeenLastCalledWith(1);
    expect(innerSpy).toHaveBeenLastCalledWith(1);

    // Dispose inner only
    innerDispose!();
    count.value = 2;
    expect(outerSpy).toHaveBeenLastCalledWith(2);
    expect(innerSpy).toHaveBeenLastCalledWith(1); // Should not update

    // Dispose outer
    outerDispose!();
    count.value = 3;
    expect(outerSpy).toHaveBeenLastCalledWith(2); // Should not update
  });

  it("should not track effects outside of createRoot", () => {
    const count = signal(0);
    const spy = vi.fn();

    // Effect created outside createRoot
    const cleanup = effect(() => spy(count.value));

    const dispose = createRoot(() => {
      // Empty scope
    });

    count.value = 1;
    expect(spy).toHaveBeenCalledTimes(2);

    // Disposing root should not affect the external effect
    dispose();

    count.value = 2;
    expect(spy).toHaveBeenCalledTimes(3);

    cleanup();
  });
});

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
        count.value;
      });
      onCleanup(() => order.push("custom"));
    });

    dispose();
    // Effects are cleaned up first, then custom cleanups
    expect(order).toEqual(["custom"]);
  });
});

describe("templateEffect", () => {
  it("should work like effect", () => {
    const count = signal(0);
    const spy = vi.fn();

    createRoot(() => {
      templateEffect(() => spy(count.value));
    });

    expect(spy).toHaveBeenCalledWith(0);
    count.value = 1;
    expect(spy).toHaveBeenCalledWith(1);
  });

  it("should be tracked by current owner", () => {
    const count = signal(0);
    const spy = vi.fn();
    let dispose: (() => void) | undefined;

    dispose = createRoot(() => {
      templateEffect(() => spy(count.value));
    });

    count.value = 1;
    dispose!();
    count.value = 2;
    expect(spy).toHaveBeenCalledTimes(2); // Only 0 and 1
  });
});
