/**
 * Tests for Hydration functionality.
 */

import { signal } from "@dathomir/reactivity";
import {
  atom,
  createAtomStore,
  defineAtomStoreSnapshot,
} from "@dathomir/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HydrationMismatchError,
  handleMismatch,
  hydrate,
  hydrateRoot,
  isHydrated,
  markHydrated,
} from "@/hydration/hydrate/implementation";

describe("HydrationMismatchError", () => {
  it("is an instance of Error", () => {
    const error = new HydrationMismatchError("test mismatch");
    expect(error).toBeInstanceOf(Error);
  });

  it("has correct name", () => {
    const error = new HydrationMismatchError("test");
    expect(error.name).toBe("HydrationMismatchError");
  });

  it("has correct message prefix", () => {
    const error = new HydrationMismatchError("expected div, got span");
    expect(error.message).toContain("expected div, got span");
    expect(error.message).toContain("Hydration mismatch");
  });
});

describe("handleMismatch", () => {
  it("throws HydrationMismatchError in dev mode", () => {
    expect(() => handleMismatch("test error")).toThrow(HydrationMismatchError);
  });
});

describe("isHydrated and markHydrated", () => {
  let host: HTMLElement;
  let shadowRoot: ShadowRoot;

  beforeEach(() => {
    host = document.createElement("div");
    shadowRoot = host.attachShadow({ mode: "open" });
    document.body.appendChild(host);
  });

  afterEach(() => {
    document.body.removeChild(host);
  });

  it("returns false for new ShadowRoot", () => {
    expect(isHydrated(shadowRoot)).toBe(false);
  });

  it("returns true after marking", () => {
    markHydrated(shadowRoot);
    expect(isHydrated(shadowRoot)).toBe(true);
  });
});

describe("hydrateRoot", () => {
  let host: HTMLElement;
  let shadowRoot: ShadowRoot;

  beforeEach(() => {
    host = document.createElement("div");
    shadowRoot = host.attachShadow({ mode: "open" });
    document.body.appendChild(host);
  });

  afterEach(() => {
    document.body.removeChild(host);
  });

  it("hydrates a ShadowRoot", () => {
    shadowRoot.innerHTML = "<div>Hello</div>";
    const setup = vi.fn();

    const dispose = hydrateRoot(shadowRoot, setup);

    expect(dispose).not.toBeNull();
    expect(setup).toHaveBeenCalled();
  });

  it("returns null for already hydrated root (idempotency)", () => {
    shadowRoot.innerHTML = "<div>Hello</div>";
    const setup = vi.fn();

    hydrateRoot(shadowRoot, setup);
    const secondDispose = hydrateRoot(shadowRoot, setup);

    expect(secondDispose).toBeNull();
    expect(setup).toHaveBeenCalledTimes(1);
  });

  it("returns dispose function to cleanup", () => {
    shadowRoot.innerHTML = "<div>Hello</div>";

    const dispose = hydrateRoot(shadowRoot, () => {});

    expect(typeof dispose).toBe("function");
  });

  it("passes request-scoped store through hydration context", () => {
    shadowRoot.innerHTML = "<div>Hello</div>";
    const countAtom = atom("count", 5);
    const store = createAtomStore({ appId: "hydrate-root-store" });
    const setup = vi.fn((ctx) => {
      expect(ctx.store).toBe(store);
      expect(ctx.store?.ref(countAtom).value).toBe(5);
    });

    hydrateRoot(shadowRoot, setup, { store });

    expect(setup).toHaveBeenCalled();
  });

  it("hydrates store snapshot before running setup when schema is provided", () => {
    const themeAtom = atom("theme", "light");
    const store = createAtomStore({ appId: "hydrate-root-snapshot" });
    const schema = defineAtomStoreSnapshot({ theme: themeAtom });

    shadowRoot.innerHTML =
      '<script type="application/json" data-dh-store>[{"theme":1},"dark"]</script><div>Hello</div>';

    const setup = vi.fn((ctx) => {
      expect(ctx.store).toBe(store);
      expect(store.ref(themeAtom).value).toBe("dark");
      expect(shadowRoot.querySelector("script[data-dh-store]")).toBeNull();
    });

    hydrateRoot(shadowRoot, setup, {
      store,
      storeSnapshotSchema: schema,
    } as never);

    expect(setup).toHaveBeenCalled();
  });

  it("throws when storeSnapshotSchema is provided without a store", () => {
    shadowRoot.innerHTML = "<div>Hello</div>";
    const schema = defineAtomStoreSnapshot({ count: atom("count", 0) });

    expect(() => {
      hydrateRoot(shadowRoot, () => {}, {
        storeSnapshotSchema: schema,
      } as never);
    }).toThrow("storeSnapshotSchema requires a store");
  });
});

describe("hydrate", () => {
  let host: HTMLElement;
  let shadowRoot: ShadowRoot;

  beforeEach(() => {
    host = document.createElement("div");
    shadowRoot = host.attachShadow({ mode: "open" });
    document.body.appendChild(host);
  });

  afterEach(() => {
    document.body.removeChild(host);
  });

  it("connects text bindings to markers", async () => {
    shadowRoot.innerHTML = "<!--dh:t:0-->initial";
    const count = signal(42);

    hydrate(shadowRoot, {
      texts: new Map([[0, () => count.value]]),
    });

    // Wait for effect to run
    await new Promise((resolve) => setTimeout(resolve, 10));

    const textNode = shadowRoot.childNodes[1] as Text;
    expect(textNode.textContent).toBe("42");
  });

  it("connects event bindings to elements", () => {
    const button = document.createElement("button");
    button.textContent = "Click";
    shadowRoot.appendChild(button);

    const handler = vi.fn();

    hydrate(shadowRoot, {
      events: new Map([[button, new Map([["click", handler]])]]),
    });

    button.click();

    expect(handler).toHaveBeenCalled();
  });

  it("returns null for already hydrated root", () => {
    shadowRoot.innerHTML = "<div>Hello</div>";

    hydrate(shadowRoot, {});
    const secondResult = hydrate(shadowRoot, {});

    expect(secondResult).toBeNull();
  });

  it("accepts a request-scoped store option", () => {
    shadowRoot.innerHTML = "<!--dh:t:0-->initial";
    const countAtom = atom("count", 8);
    const store = createAtomStore({ appId: "hydrate-store" });

    const dispose = hydrate(
      shadowRoot,
      {
        texts: new Map([[0, () => store.ref(countAtom).value]]),
      },
      { store },
    );

    expect(dispose).not.toBeNull();
  });

  it("hydrates store values from a data-dh-store script before binding text updates", async () => {
    const countAtom = atom("count", 0);
    const store = createAtomStore({ appId: "hydrate-binding-store" });
    const schema = defineAtomStoreSnapshot({ count: countAtom });

    shadowRoot.innerHTML =
      '<script type="application/json" data-dh-store>[{"count":1},42]</script><!--dh:t:0-->initial';

    hydrate(
      shadowRoot,
      {
        texts: new Map([[0, () => store.ref(countAtom).value]]),
      },
      { store, storeSnapshotSchema: schema } as never,
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    const textNode = shadowRoot.childNodes[1] as Text;
    expect(store.ref(countAtom).value).toBe(42);
    expect(textNode.textContent).toBe("42");
    expect(shadowRoot.querySelector("script[data-dh-store]")).toBeNull();
  });

  it("leaves store values untouched when no data-dh-store script exists", () => {
    const countAtom = atom("count", 1);
    const store = createAtomStore({ appId: "hydrate-no-script" });
    const schema = defineAtomStoreSnapshot({ count: countAtom });

    store.set(countAtom, 9);
    shadowRoot.innerHTML = "<div>Hello</div>";

    hydrateRoot(shadowRoot, () => {}, {
      store,
      storeSnapshotSchema: schema,
    } as never);

    expect(store.ref(countAtom).value).toBe(9);
  });
});
