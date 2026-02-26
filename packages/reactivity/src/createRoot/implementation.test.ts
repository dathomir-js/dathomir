import { describe, expect, it, vi } from "vitest";

import {
  createRoot,
  effect,
  onCleanup,
  signal,
  templateEffect,
} from "../index";

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

    count.set(1);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(1);

    dispose();

    count.set(2);
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

    count.set(5);
    expect(spy1).toHaveBeenCalledWith(5);
    expect(spy2).toHaveBeenCalledWith(10);

    dispose();

    count.set(10);
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

    count.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    internalDispose!();

    count.set(2);
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

    count.set(1);
    expect(outerSpy).toHaveBeenLastCalledWith(1);
    expect(innerSpy).toHaveBeenLastCalledWith(1);

    // Dispose inner only
    innerDispose!();
    count.set(2);
    expect(outerSpy).toHaveBeenLastCalledWith(2);
    expect(innerSpy).toHaveBeenLastCalledWith(1); // Should not update

    // Dispose outer
    outerDispose!();
    count.set(3);
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

    count.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    // Disposing root should not affect the external effect
    dispose();

    count.set(2);
    expect(spy).toHaveBeenCalledTimes(3);

    cleanup();
  });
});

describe("createRoot - nested scopes", () => {
  it("disposes child scopes when parent is disposed", () => {
    const count = signal(0);
    const outerSpy = vi.fn();
    const innerSpy = vi.fn();

    const outerDispose = createRoot(() => {
      templateEffect(() => outerSpy(count.value));

      createRoot(() => {
        templateEffect(() => innerSpy(count.value));
      });
    });

    count.set(1);
    expect(outerSpy).toHaveBeenLastCalledWith(1);
    expect(innerSpy).toHaveBeenLastCalledWith(1);

    outerDispose();

    count.set(2);
    expect(outerSpy).toHaveBeenCalledTimes(2);
    expect(innerSpy).toHaveBeenCalledTimes(2);
  });

  it("child dispose does not affect parent", () => {
    const count = signal(0);
    const outerSpy = vi.fn();
    const innerSpy = vi.fn();
    let innerDispose: (() => void) | undefined;

    const outerDispose = createRoot(() => {
      templateEffect(() => outerSpy(count.value));

      innerDispose = createRoot(() => {
        templateEffect(() => innerSpy(count.value));
      });
    });

    count.set(1);
    expect(outerSpy).toHaveBeenLastCalledWith(1);
    expect(innerSpy).toHaveBeenLastCalledWith(1);

    innerDispose!();

    count.set(2);
    expect(outerSpy).toHaveBeenLastCalledWith(2);
    expect(innerSpy).toHaveBeenCalledTimes(2);

    outerDispose();
  });
});

describe("createRoot - edge cases", () => {
  it("ignores second dispose call", () => {
    const cleanupSpy = vi.fn();

    const dispose = createRoot(() => {
      onCleanup(cleanupSpy);
    });

    dispose();
    expect(cleanupSpy).toHaveBeenCalledTimes(1);

    dispose();
    expect(cleanupSpy).toHaveBeenCalledTimes(1);
  });

  it("effect does not run after dispose", () => {
    const count = signal(0);
    const spy = vi.fn();

    const dispose = createRoot(() => {
      templateEffect(() => spy(count.value));
    });

    expect(spy).toHaveBeenCalledTimes(1);
    dispose();

    count.set(1);
    count.set(2);
    count.set(3);

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("createRoot - owner context restoration", () => {
  it("restores outer owner after inner createRoot so subsequent templateEffects register with outer", () => {
    const count = signal(0);
    const spy = vi.fn();

    const disposeOuter = createRoot(() => {
      // Inner root executes and returns — outer owner must be restored afterward
      createRoot(() => {});

      // If setCurrentOwner was not restored, this templateEffect would be
      // registered with the already-returned inner owner and never disposed
      // by disposeOuter.
      templateEffect(() => spy(count.value));
    });

    count.set(1);
    expect(spy).toHaveBeenCalledTimes(2);

    // Disposing outer must stop the templateEffect
    disposeOuter();
    count.set(2);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("sequential createRoot scopes are independent of each other", () => {
    const count = signal(0);
    const spy1 = vi.fn();
    const spy2 = vi.fn();

    const dispose1 = createRoot(() => {
      templateEffect(() => spy1(count.value));
    });

    // After dispose1's root finished, owner must be restored so that
    // this second root is truly independent.
    const dispose2 = createRoot(() => {
      templateEffect(() => spy2(count.value));
    });

    count.set(1);
    expect(spy1).toHaveBeenCalledTimes(2);
    expect(spy2).toHaveBeenCalledTimes(2);

    dispose1();
    count.set(2);
    expect(spy1).toHaveBeenCalledTimes(2); // stopped
    expect(spy2).toHaveBeenCalledTimes(3); // still running

    dispose2();
  });
});
