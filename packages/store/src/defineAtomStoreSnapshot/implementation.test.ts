import { describe, expect, it } from "vitest";

import type { Getter } from "../atom/implementation";
import { atom } from "../atom/implementation";
import { createAtomStore } from "../createAtomStore/implementation";
import { defineAtomStoreSnapshot } from "./implementation";

describe("defineAtomStoreSnapshot", () => {
  describe("serialize", () => {
    it("serializes only schema-listed primitive atoms from the current store", () => {
      const countAtom = atom("count", 0);
      const themeAtom = atom("theme", "light");
      const ignoredAtom = atom("ignored", "skip");
      const schema = defineAtomStoreSnapshot({
        count: countAtom,
        uiTheme: themeAtom,
      });
      const store = createAtomStore({ appId: "snapshot-1" });

      store.set(countAtom, 5);
      store.set(themeAtom, "dark");
      store.set(ignoredAtom, "kept-out");

      expect(schema.serialize(store)).toEqual({
        count: 5,
        uiTheme: "dark",
      });
    });

    it("keeps values isolated across stores sharing the same atom definitions", () => {
      const countAtom = atom("count", 1);
      const schema = defineAtomStoreSnapshot({ count: countAtom });
      const left = createAtomStore({ appId: "left" });
      const right = createAtomStore({ appId: "right" });

      left.set(countAtom, 10);
      right.set(countAtom, 20);

      expect(schema.serialize(left)).toEqual({ count: 10 });
      expect(schema.serialize(right)).toEqual({ count: 20 });
    });

    it("flattens forked stores using the child-visible values", () => {
      const countAtom = atom("count", 1);
      const themeAtom = atom("theme", "light");
      const schema = defineAtomStoreSnapshot({
        count: countAtom,
        theme: themeAtom,
      });
      const root = createAtomStore({ appId: "root" });

      root.set(countAtom, 3);
      const child = root.fork({ values: [[themeAtom, "dark"]] });

      expect(schema.serialize(child)).toEqual({
        count: 3,
        theme: "dark",
      });
    });

    it("uses schema keys rather than atom.key for snapshot field names", () => {
      const themeAtom = atom("theme", "light");
      const schema = defineAtomStoreSnapshot({ uiTheme: themeAtom });
      const store = createAtomStore({ appId: "schema-key" });

      store.set(themeAtom, "dark");

      expect(schema.serialize(store)).toEqual({ uiTheme: "dark" });
    });
  });

  describe("values", () => {
    it("returns entries that can be passed directly to createAtomStore", () => {
      const countAtom = atom("count", 0);
      const themeAtom = atom("theme", "light");
      const schema = defineAtomStoreSnapshot({
        count: countAtom,
        theme: themeAtom,
      });

      const store = createAtomStore({
        appId: "values-store",
        values: schema.values({ count: 8, theme: "dark" }),
      });

      expect(store.ref(countAtom).value).toBe(8);
      expect(store.ref(themeAtom).value).toBe("dark");
    });
  });

  describe("hydrate", () => {
    it("hydrates an existing store with snapshot values", () => {
      const countAtom = atom("count", 0);
      const themeAtom = atom("theme", "light");
      const schema = defineAtomStoreSnapshot({
        count: countAtom,
        theme: themeAtom,
      });
      const store = createAtomStore({ appId: "hydrate-store" });

      schema.hydrate(store, { count: 11, theme: "dark" });

      expect(store.ref(countAtom).value).toBe(11);
      expect(store.ref(themeAtom).value).toBe("dark");
    });
  });

  describe("validation", () => {
    it("fails fast when a derived atom is included in the schema", () => {
      const countAtom = atom("count", 1);
      const doubledAtom = atom("doubled", (get: Getter) => get(countAtom) * 2);

      expect(() => {
        defineAtomStoreSnapshot({
          doubled: doubledAtom as never,
        });
      }).toThrow('Snapshot schema entry "doubled" must reference a primitive atom');
    });
  });
});
