import { describe, expect, it } from "vitest";

import { setAttr, setProp, setText } from "../../src/index";

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
});
