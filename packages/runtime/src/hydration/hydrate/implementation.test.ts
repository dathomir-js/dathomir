/**
 * Tests for Hydration functionality.
 */

import { signal } from "@dathomir/reactivity";
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
});
