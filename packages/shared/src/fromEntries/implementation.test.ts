import { describe, expect, it } from "vitest";

import { fromEntries } from "./implementation";

describe("fromEntries", () => {
  it("should create an object from entries", () => {
    const result = fromEntries([
      ["a", 1],
      ["b", "hello"],
      ["c", true],
    ] as const);

    expect(result).toEqual({ a: 1, b: "hello", c: true });
  });

  it("should return empty object for empty array", () => {
    const result = fromEntries([]);
    expect(result).toEqual({});
  });

  it("should handle single entry", () => {
    const result = fromEntries([["key", "value"]] as const);
    expect(result).toEqual({ key: "value" });
  });

  it("should handle numeric values", () => {
    const result = fromEntries([
      ["x", 10],
      ["y", 20],
    ] as const);

    expect(result).toEqual({ x: 10, y: 20 });
  });

  it("should handle null and undefined values", () => {
    const result = fromEntries([
      ["a", null],
      ["b", undefined],
    ] as const);

    expect(result).toEqual({ a: null, b: undefined });
  });

  it("should use last value for duplicate keys", () => {
    const result = fromEntries([
      ["a", 1],
      ["a", 2],
    ] as const);

    expect(result).toEqual({ a: 2 });
  });
});
