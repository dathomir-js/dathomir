import { describe, expect, it } from "vitest";

import { setText } from "@/index";

describe("setText", () => {
  it("should set string correctly", () => {
    const textNode = document.createTextNode("");
    setText(textNode, "Hello World");
    expect(textNode.data).toBe("Hello World");
  });

  it("should convert number to string", () => {
    const textNode = document.createTextNode("");
    setText(textNode, 42);
    expect(textNode.data).toBe("42");
  });

  it("should convert zero to string", () => {
    const textNode = document.createTextNode("");
    setText(textNode, 0);
    expect(textNode.data).toBe("0");
  });

  it("should convert negative number to string", () => {
    const textNode = document.createTextNode("");
    setText(textNode, -123);
    expect(textNode.data).toBe("-123");
  });

  it("should convert float to string", () => {
    const textNode = document.createTextNode("");
    setText(textNode, 3.14);
    expect(textNode.data).toBe("3.14");
  });

  it("should set null as empty string", () => {
    const textNode = document.createTextNode("existing");
    setText(textNode, null);
    expect(textNode.data).toBe("");
  });

  it("should set undefined as empty string", () => {
    const textNode = document.createTextNode("existing");
    setText(textNode, undefined);
    expect(textNode.data).toBe("");
  });

  it("should not throw when setting the same value", () => {
    const textNode = document.createTextNode("");
    setText(textNode, "test");
    expect(() => setText(textNode, "test")).not.toThrow();
    expect(textNode.data).toBe("test");
  });

  it("should update existing text content", () => {
    const textNode = document.createTextNode("old");
    setText(textNode, "new");
    expect(textNode.data).toBe("new");
  });

  it("should handle empty string", () => {
    const textNode = document.createTextNode("existing");
    setText(textNode, "");
    expect(textNode.data).toBe("");
  });

  it("should convert boolean true to string", () => {
    const textNode = document.createTextNode("");
    setText(textNode, true);
    expect(textNode.data).toBe("true");
  });

  it("should convert boolean false to string", () => {
    const textNode = document.createTextNode("");
    setText(textNode, false);
    expect(textNode.data).toBe("false");
  });

  it("should convert object to string using toString", () => {
    const textNode = document.createTextNode("");
    const obj = { toString: () => "custom" };
    setText(textNode, obj);
    expect(textNode.data).toBe("custom");
  });

  it("should handle special characters", () => {
    const textNode = document.createTextNode("");
    setText(textNode, "<script>alert('xss')</script>");
    expect(textNode.data).toBe("<script>alert('xss')</script>");
  });

  it("should handle unicode characters", () => {
    const textNode = document.createTextNode("");
    setText(textNode, "日本語テスト🎉");
    expect(textNode.data).toBe("日本語テスト🎉");
  });
});
