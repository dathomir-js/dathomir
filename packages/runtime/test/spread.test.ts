import { describe, expect, it, vi } from "vitest";

import { createRoot, event, spread } from "../src/index";

describe("spread", () => {
  it("should apply initial props", () => {
    const div = document.createElement("div");
    spread(div, null, { class: "test", "data-id": "1" });

    expect(div.className).toBe("test");
    expect(div.getAttribute("data-id")).toBe("1");
  });

  it("should update changed props", () => {
    const div = document.createElement("div");
    const prev = spread(div, null, { class: "old" });
    spread(div, prev, { class: "new" });

    expect(div.className).toBe("new");
  });

  it("should remove props that are no longer present", () => {
    const div = document.createElement("div");
    const prev = spread(div, null, { class: "test", "data-id": "1" });
    spread(div, prev, { class: "test" });

    expect(div.hasAttribute("data-id")).toBe(false);
  });

  it("should not update unchanged props", () => {
    const div = document.createElement("div");
    const prev = spread(div, null, { class: "test" });

    // Spy on setAttribute to verify it's not called for unchanged props
    const setAttributeSpy = vi.spyOn(div, "setAttribute");
    spread(div, prev, { class: "test" });

    expect(setAttributeSpy).not.toHaveBeenCalled();
  });

  it("should handle event handlers in props", () => {
    const div = document.createElement("div");
    const handler = vi.fn();

    createRoot(() => {
      spread(div, null, { onClick: handler });
    });

    div.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should return next props for chaining", () => {
    const div = document.createElement("div");
    const props = { class: "test" };
    const result = spread(div, null, props);

    expect(result).toBe(props);
  });
});

describe("event", () => {
  it("should add event listener", () => {
    const button = document.createElement("button");
    const handler = vi.fn();

    createRoot(() => {
      event("click", button, handler);
    });

    button.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should remove event listener on dispose", () => {
    const button = document.createElement("button");
    const handler = vi.fn();

    const dispose = createRoot(() => {
      event("click", button, handler);
    });

    button.click();
    expect(handler).toHaveBeenCalledTimes(1);

    dispose();

    button.click();
    expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it("should pass event object to handler", () => {
    const button = document.createElement("button");
    let receivedEvent: Event | null = null;

    createRoot(() => {
      event("click", button, (e: Event) => {
        receivedEvent = e;
      });
    });

    button.click();
    expect(receivedEvent).toBeInstanceOf(MouseEvent);
  });
});
