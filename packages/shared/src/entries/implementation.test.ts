import { describe, expect, it } from "vitest";

import { entries } from "./implementation";

describe("entries", () => {
  it("should return entries of an object", () => {
    const obj = { a: 1, b: "hello", c: true };
    const result = entries(obj);

    expect(result).toEqual([
      ["a", 1],
      ["b", "hello"],
      ["c", true],
    ]);
  });

  it("should return empty array for empty object", () => {
    const result = entries({});
    expect(result).toEqual([]);
  });

  it("should handle single property", () => {
    const result = entries({ key: "value" });
    expect(result).toEqual([["key", "value"]]);
  });

  it("should handle nested objects", () => {
    const nested = { x: 1 };
    const result = entries({ a: nested });
    expect(result).toEqual([["a", nested]]);
    expect(result[0][1]).toBe(nested);
  });

  it("should handle null and undefined values", () => {
    const result = entries({ a: null, b: undefined });
    expect(result).toEqual([
      ["a", null],
      ["b", undefined],
    ]);
  });
});
