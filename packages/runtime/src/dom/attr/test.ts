import { describe, expect, it } from "vitest";

import { setAttr, setProp, setText } from "@//index";

describe("setText", () => {
  it("should set text content of a text node", () => {
    const textNode = document.createTextNode("");
    setText(textNode, "Hello World");
    expect(textNode.data).toBe("Hello World");
  });

  it("should update existing text content", () => {
    const textNode = document.createTextNode("old");
    setText(textNode, "new");
    expect(textNode.data).toBe("new");
  });
});

describe("setAttr", () => {
  it("should set string attribute", () => {
    const div = document.createElement("div");
    setAttr(div, "class", "test");
    expect(div.getAttribute("class")).toBe("test");
  });

  it("should set boolean attribute (true)", () => {
    const button = document.createElement("button");
    setAttr(button, "disabled", true);
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("disabled")).toBe("");
  });

  it("should remove attribute when value is false", () => {
    const button = document.createElement("button");
    button.setAttribute("disabled", "");
    setAttr(button, "disabled", false);
    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("should remove attribute when value is null", () => {
    const div = document.createElement("div");
    div.setAttribute("class", "test");
    setAttr(div, "class", null);
    expect(div.hasAttribute("class")).toBe(false);
  });

  it("should remove attribute when value is undefined", () => {
    const div = document.createElement("div");
    div.setAttribute("class", "test");
    setAttr(div, "class", undefined);
    expect(div.hasAttribute("class")).toBe(false);
  });

  it("should convert number to string", () => {
    const div = document.createElement("div");
    setAttr(div, "data-count", 42);
    expect(div.getAttribute("data-count")).toBe("42");
  });

  it("should set class attribute correctly", () => {
    const div = document.createElement("div");
    setAttr(div, "class", "foo bar");
    expect(div.className).toBe("foo bar");
  });

  it("should update existing class attribute", () => {
    const div = document.createElement("div");
    div.className = "old-class";
    setAttr(div, "class", "new-class");
    expect(div.className).toBe("new-class");
  });

  it("should set string style attribute", () => {
    const div = document.createElement("div");
    setAttr(div, "style", "color: red; font-size: 16px");
    expect(div.getAttribute("style")).toBe("color: red; font-size: 16px");
  });

  it("should update style attribute", () => {
    const div = document.createElement("div");
    setAttr(div, "style", "color: red");
    setAttr(div, "style", "color: blue");
    expect(div.style.color).toBe("blue");
  });

  it("should handle data-* attributes", () => {
    const div = document.createElement("div");
    setAttr(div, "data-test-id", "123");
    expect(div.getAttribute("data-test-id")).toBe("123");
    expect(div.dataset.testId).toBe("123");
  });

  it("should handle aria-* attributes", () => {
    const button = document.createElement("button");
    setAttr(button, "aria-label", "Close");
    expect(button.getAttribute("aria-label")).toBe("Close");
  });
});

describe("setProp", () => {
  it("should set DOM property", () => {
    const input = document.createElement("input");
    setProp(input, "value", "test");
    expect(input.value).toBe("test");
  });

  it("should set boolean property", () => {
    const input = document.createElement("input");
    input.type = "checkbox";
    setProp(input, "checked", true);
    expect(input.checked).toBe(true);
  });

  it("should set custom property", () => {
    const div = document.createElement("div");
    setProp(div, "customProp", { custom: "value" });
    expect((div as unknown as Record<string, unknown>).customProp).toEqual({
      custom: "value",
    });
  });

  it("should set null property (not remove)", () => {
    const div = document.createElement("div");
    setProp(div, "customProp", "initial");
    setProp(div, "customProp", null);
    expect((div as unknown as Record<string, unknown>).customProp).toBeNull();
  });

  it("should set undefined property", () => {
    const div = document.createElement("div");
    setProp(div, "customProp", "initial");
    setProp(div, "customProp", undefined);
    expect(
      (div as unknown as Record<string, unknown>).customProp,
    ).toBeUndefined();
  });

  it("should set checked property on checkbox", () => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    setProp(checkbox, "checked", false);
    expect(checkbox.checked).toBe(false);
    setProp(checkbox, "checked", true);
    expect(checkbox.checked).toBe(true);
  });

  it("should set indeterminate property on checkbox", () => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    setProp(checkbox, "indeterminate", true);
    expect(checkbox.indeterminate).toBe(true);
  });

  it("should set textContent property", () => {
    const div = document.createElement("div");
    setProp(div, "textContent", "Hello");
    expect(div.textContent).toBe("Hello");
  });

  it("should set innerHTML property", () => {
    const div = document.createElement("div");
    setProp(div, "innerHTML", "<span>test</span>");
    expect(div.innerHTML).toBe("<span>test</span>");
  });
});
