import { describe, it, expectTypeOf } from "vitest";
import { signal, computed, toUnreactive } from "../src/index";
import type { Unwrap } from "../src/index";

describe("toUnreactive type inference", () => {
  it("should infer primitive types", () => {
    const result = toUnreactive(42);
    expectTypeOf(result).toEqualTypeOf<number>();

    const str = toUnreactive("hello");
    expectTypeOf(str).toEqualTypeOf<string>();

    const bool = toUnreactive(true);
    expectTypeOf(bool).toEqualTypeOf<boolean>();
  });

  it("should unwrap signal type", () => {
    const count = signal(42);
    const result = toUnreactive(count);
    expectTypeOf(result).toEqualTypeOf<number>();

    const name = signal("Alice");
    const nameResult = toUnreactive(name);
    expectTypeOf(nameResult).toEqualTypeOf<string>();
  });

  it("should unwrap computed type", () => {
    const count = signal(10);
    const doubled = computed(() => count.value * 2);
    const result = toUnreactive(doubled);
    expectTypeOf(result).toEqualTypeOf<number>();
  });

  it("should unwrap array with signals", () => {
    const arr = [signal(1), signal(2), signal(3)];
    const result = toUnreactive(arr);
    expectTypeOf(result).toEqualTypeOf<number[]>();
  });

  it("should unwrap object with signals", () => {
    const obj = {
      count: signal(42),
      name: signal("Alice"),
    };
    const result = toUnreactive(obj);
    expectTypeOf(result).toEqualTypeOf<{
      count: number;
      name: string;
    }>();
  });

  it("should unwrap nested structures", () => {
    const nested = {
      user: {
        id: signal(1),
        name: signal("Bob"),
        active: computed(() => true),
      },
      tags: [signal("tag1"), signal("tag2")],
    };
    const result = toUnreactive(nested);
    expectTypeOf(result).toEqualTypeOf<{
      user: {
        id: number;
        name: string;
        active: boolean;
      };
      tags: string[];
    }>();
  });

  it("should preserve Date type", () => {
    const date = new Date();
    const result = toUnreactive(date);
    expectTypeOf(result).toEqualTypeOf<Date>();
  });

  it("should preserve RegExp type", () => {
    const regex = /test/;
    const result = toUnreactive(regex);
    expectTypeOf(result).toEqualTypeOf<RegExp>();
  });

  it("should preserve Map type", () => {
    const map = new Map([["key", 1]]);
    const result = toUnreactive(map);
    expectTypeOf(result).toEqualTypeOf<Map<string, number>>();
  });

  it("should preserve Set type", () => {
    const set = new Set([1, 2, 3]);
    const result = toUnreactive(set);
    expectTypeOf(result).toEqualTypeOf<Set<number>>();
  });

  it("should preserve function type", () => {
    const fn = () => 42;
    const result = toUnreactive(fn);
    expectTypeOf(result).toEqualTypeOf<() => number>();
  });

  describe("Unwrap type utility", () => {
    it("should unwrap signal type", () => {
      type TestSignal = { __type__: "signal"; value: number; peek(): number };
      type Result = Unwrap<TestSignal>;
      expectTypeOf<Result>().toEqualTypeOf<number>();
    });

    it("should unwrap nested reactive types", () => {
      type TestData = {
        count: { __type__: "signal"; value: number; peek(): number };
        name: { __type__: "computed"; value: string; peek(): string };
        nested: {
          values: { __type__: "signal"; value: number; peek(): number }[];
        };
      };
      type Result = Unwrap<TestData>;
      expectTypeOf<Result>().toEqualTypeOf<{
        count: number;
        name: string;
        nested: {
          values: number[];
        };
      }>();
    });
  });
});
