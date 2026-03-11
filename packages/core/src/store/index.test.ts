import { describe, expect, it } from "vitest";

import { atom, createAtomStore, withStore } from "./index";

describe("core store re-exports", () => {
  it("re-exports atom, createAtomStore, and withStore", () => {
    const countAtom = atom("count", 1);
    const store = createAtomStore({ appId: "core-store" });

    const result = withStore(store, () => store.ref(countAtom).value);

    expect(result).toBe(1);
  });
});
