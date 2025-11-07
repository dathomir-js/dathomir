import type { VNodeChild } from "@/types";
import type { Computed } from "@dathomir/reactivity";

/**
 * Runtime reactive predicate - checks if a value is a Computed node.
 * Optimized: checks __type__ first as it's the fastest discriminator.
 */
export const isReactiveChild = (
  value: VNodeChild,
): value is Computed<unknown> => {
  if (value == null || typeof value !== "object") return false;
  const type = (value as any).__type__;
  return type === "computed";
};

/**
 * Unwrap nested reactive values recursively.
 * Transformer may wrap JSX expressions in computed, causing double-wrapping.
 */
export const unwrapReactive = (value: unknown): unknown => {
  let v = value;
  while (
    v != null &&
    typeof v === "object" &&
    isReactiveChild(v as VNodeChild)
  ) {
    v = (v as Computed<unknown>).value;
  }
  return v;
};
