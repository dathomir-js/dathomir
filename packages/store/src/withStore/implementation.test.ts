import { describe, expect, it } from "vitest";

import { atom, type PrimitiveAtom } from "../atom/implementation";
import { createAtomStore } from "../createAtomStore/implementation";
import { getCurrentStore, withStore } from "./implementation";

function readFromCurrentStore<T>(currentAtom: PrimitiveAtom<T>): T {
  const store = getCurrentStore();
  if (store === undefined) {
    throw new Error("No current store");
  }

  return store.get(currentAtom);
}

function requireCurrentStore() {
  const store = getCurrentStore();
  if (store === undefined) {
    throw new Error("No current store");
  }
  return store;
}

describe("withStore", () => {
  it("returns the callback result while setting the current store during execution", () => {
    const store = createAtomStore({ appId: "app-1" });

    const result = withStore(store, () => {
      expect(getCurrentStore()).toBe(store);
      return "ok";
    });

    expect(result).toBe("ok");
    expect(getCurrentStore()).toBeUndefined();
  });

  it("prefers the inner store for nested boundaries and restores the outer store afterward", () => {
    const outerStore = createAtomStore({ appId: "app-outer" });
    const innerStore = createAtomStore({ appId: "app-inner" });
    const seen: string[] = [];

    withStore(outerStore, () => {
      seen.push(requireCurrentStore().appId);

      withStore(innerStore, () => {
        seen.push(requireCurrentStore().appId);
      });

      seen.push(requireCurrentStore().appId);
    });

    expect(seen).toEqual(["app-outer", "app-inner", "app-outer"]);
    expect(getCurrentStore()).toBeUndefined();
  });

  it("restores the outer store even when a nested callback throws", () => {
    const outerStore = createAtomStore({ appId: "app-outer" });
    const innerStore = createAtomStore({ appId: "app-inner" });
    const error = new Error("boom");

    expect(() => {
      withStore(outerStore, () => {
        expect(getCurrentStore()).toBe(outerStore);

        expect(() => {
          withStore(innerStore, () => {
            throw error;
          });
        }).toThrow(error);

        expect(getCurrentStore()).toBe(outerStore);
      });
    }).not.toThrow();

    expect(getCurrentStore()).toBeUndefined();
  });

  it("propagates the store boundary to async callbacks within the same context (Node.js / Edge)", async () => {
    const store = createAtomStore({ appId: "app-1" });
    const seen: Array<string | undefined> = [];
    let resolveTask!: () => void;
    const task = new Promise<void>((resolve) => {
      resolveTask = resolve;
    });

    withStore(store, () => {
      seen.push(getCurrentStore()?.appId);
      queueMicrotask(() => {
        seen.push(getCurrentStore()?.appId);
        resolveTask();
      });
    });

    await task;

    expect(seen).toEqual(["app-1", "app-1"]);
  });

  it("works with forked child stores for nested subtree overrides", () => {
    const themeAtom = atom("theme", "light");
    const rootStore = createAtomStore({ appId: "app-1" });
    const childStore = rootStore.fork({ values: [[themeAtom, "dark"]] });
    const seen: string[] = [];

    withStore(rootStore, () => {
      seen.push(requireCurrentStore().get(themeAtom));

      withStore(childStore, () => {
        seen.push(requireCurrentStore().get(themeAtom));
      });

      seen.push(requireCurrentStore().get(themeAtom));
    });

    expect(seen).toEqual(["light", "dark", "light"]);
  });

  it("lets nested code resolve values through the current store boundary", () => {
    const themeAtom = atom("theme", "light");
    const rootStore = createAtomStore({ appId: "app-1" });
    const childStore = rootStore.fork({ values: [[themeAtom, "dark"]] });

    const seen = withStore(rootStore, () => {
      const outer = readFromCurrentStore(themeAtom);
      const inner = withStore(childStore, () =>
        readFromCurrentStore(themeAtom),
      );
      const restored = readFromCurrentStore(themeAtom);

      return [outer, inner, restored];
    });

    expect(seen).toEqual(["light", "dark", "light"]);
  });

  it("isolates concurrent withStore calls so parallel requests do not leak stores", async () => {
    const storeA = createAtomStore({ appId: "request-A" });
    const storeB = createAtomStore({ appId: "request-B" });
    const seenA: Array<string | undefined> = [];
    const seenB: Array<string | undefined> = [];

    async function delay(ms: number): Promise<void> {
      await new Promise<void>((resolve) => setTimeout(resolve, ms));
    }

    const requestA = withStore(storeA, async () => {
      seenA.push(getCurrentStore()?.appId);
      await delay(50);
      seenA.push(getCurrentStore()?.appId);
      await delay(50);
      seenA.push(getCurrentStore()?.appId);
    });

    const requestB = withStore(storeB, async () => {
      seenB.push(getCurrentStore()?.appId);
      await delay(30);
      seenB.push(getCurrentStore()?.appId);
      await delay(30);
      seenB.push(getCurrentStore()?.appId);
    });

    await Promise.all([requestA, requestB]);

    expect(seenA).toEqual(["request-A", "request-A", "request-A"]);
    expect(seenB).toEqual(["request-B", "request-B", "request-B"]);
  });

  it("returns undefined outside any store boundary", () => {
    expect(getCurrentStore()).toBeUndefined();
  });
});
