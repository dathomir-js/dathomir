import { describe, expect, it } from "vitest";

import { atom, createAtomStore, getCurrentStore, withStore } from "./index";

describe("core store re-exports", () => {
  it("re-exports atom, createAtomStore, getCurrentStore, and withStore", () => {
    const countAtom = atom("count", 1);
    const store = createAtomStore({ appId: "core-store" });

    const result = withStore(store, () => {
      expect(getCurrentStore()).toBe(store);
      return store.ref(countAtom).value;
    });

    expect(result).toBe(1);
    expect(getCurrentStore()).toBeUndefined();
  });
});
