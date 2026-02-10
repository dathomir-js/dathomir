import { describe, expect, it, vi } from "vitest";

import { batch, computed, createRoot, signal, templateEffect } from "../index";

describe("templateEffect", () => {
  describe("Basic behavior", () => {
    it("runs synchronously on first execution", () => {
      const spy = vi.fn();
      createRoot(() => {
        templateEffect(() => spy());
      });
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("re-runs when dependent signal changes", () => {
      const count = signal(0);
      const spy = vi.fn();

      createRoot(() => {
        templateEffect(() => spy(count.value));
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(0);

      count.set(1);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(1);

      count.set(2);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith(2);
    });

    it("stops when createRoot.dispose() is called", () => {
      const count = signal(0);
      const spy = vi.fn();

      const dispose = createRoot(() => {
        templateEffect(() => spy(count.value));
      });

      expect(spy).toHaveBeenCalledTimes(1);

      count.set(1);
      expect(spy).toHaveBeenCalledTimes(2);

      dispose();

      count.set(2);
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe("Dependency tracking", () => {
    it("registers dependency when reading signal.value", () => {
      const a = signal(1);
      const b = signal(2);
      const spy = vi.fn();

      createRoot(() => {
        templateEffect(() => {
          spy(a.value + b.value);
        });
      });

      expect(spy).toHaveBeenCalledWith(3);

      a.set(10);
      expect(spy).toHaveBeenCalledWith(12);

      b.set(20);
      expect(spy).toHaveBeenCalledWith(30);
    });

    it("registers dependency when reading computed.value", () => {
      const count = signal(1);
      const doubled = computed(() => count.value * 2);
      const spy = vi.fn();

      createRoot(() => {
        templateEffect(() => {
          spy(doubled.value);
        });
      });

      expect(spy).toHaveBeenCalledWith(2);

      count.set(5);
      expect(spy).toHaveBeenCalledWith(10);
    });

    it("does not register dependency when using peek()", () => {
      const count = signal(0);
      const spy = vi.fn();

      createRoot(() => {
        templateEffect(() => {
          spy(count.peek());
        });
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(0);

      count.set(1);
      expect(spy).toHaveBeenCalledTimes(1);

      count.set(2);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Batch integration", () => {
    it("runs effect only once when multiple signals are updated in batch", () => {
      const a = signal(0);
      const b = signal(0);
      const spy = vi.fn();

      createRoot(() => {
        templateEffect(() => {
          spy(a.value + b.value);
        });
      });

      expect(spy).toHaveBeenCalledTimes(1);

      batch(() => {
        a.set(1);
        b.set(2);
      });

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(3);
    });

    it("flushes at the end of batch", () => {
      const count = signal(0);
      const observed: number[] = [];

      createRoot(() => {
        templateEffect(() => {
          observed.push(count.value);
        });
      });

      expect(observed).toEqual([0]);

      batch(() => {
        count.set(1);
        count.set(2);
        count.set(3);
      });

      expect(observed).toEqual([0, 3]);
    });
  });

  describe("Outside scope", () => {
    it("effect is still registered but not auto-disposed when called outside createRoot", () => {
      const count = signal(0);
      const spy = vi.fn();

      templateEffect(() => spy(count.value));

      expect(spy).toHaveBeenCalledTimes(1);

      count.set(1);
      expect(spy).toHaveBeenCalledTimes(2);

      count.set(2);
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });

  describe("Owner tracking", () => {
    it("should work like effect", () => {
      const count = signal(0);
      const spy = vi.fn();

      createRoot(() => {
        templateEffect(() => spy(count.value));
      });

      expect(spy).toHaveBeenCalledWith(0);
      count.set(1);
      expect(spy).toHaveBeenCalledWith(1);
    });

    it("should be tracked by current owner", () => {
      const count = signal(0);
      const spy = vi.fn();
      let dispose: (() => void) | undefined;

      dispose = createRoot(() => {
        templateEffect(() => spy(count.value));
      });

      count.set(1);
      dispose!();
      count.set(2);
      expect(spy).toHaveBeenCalledTimes(2); // Only 0 and 1
    });

    it("is automatically registered to current scope", () => {
      const count = signal(0);
      const spy = vi.fn();

      const dispose = createRoot(() => {
        templateEffect(() => spy(count.value));
      });

      expect(spy).toHaveBeenCalledWith(0);
      count.set(1);
      expect(spy).toHaveBeenCalledWith(1);

      dispose();
      count.set(2);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("is not registered when called outside scope", () => {
      const count = signal(0);
      const spy = vi.fn();

      templateEffect(() => spy(count.value));

      expect(spy).toHaveBeenCalledWith(0);
      count.set(1);
      expect(spy).toHaveBeenCalledWith(1);

      const dispose = createRoot(() => {});
      dispose();

      count.set(2);
      expect(spy).toHaveBeenCalledWith(2);
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });
});
