import type { VNode, VNodeChild } from "@/types";
import type { Computed } from "@dathomir/reactivity";

export const isVNode = (value: unknown): value is VNode => {
  return !!value && typeof value === "object" && "t" in value;
};

export const isReactive = (value: unknown): value is Computed<unknown> => {
  if (value == null || typeof value !== "object") return false;
  const type = (value as any).__type__;
  return type === "computed";
};

// Alias for compatibility
export const isReactiveChild = isReactive;

/**
 * Unwrap nested reactive values recursively.
 * Transformer may wrap JSX expressions in computed, causing double-wrapping.
 */
export const unwrapReactive = (value: unknown): unknown => {
  let v = value;
  while (v != null && typeof v === "object" && isReactive(v as VNodeChild)) {
    v = (v as Computed<unknown>).value;
  }
  return v;
};
