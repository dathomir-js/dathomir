import type { VNodeChild } from "@/types";

/**
 * Runtime reactive predicate - checks if a value is a Computed node.
 * Only Computed (not raw Signal) appears at top-level children because
 * the transformer wraps JSX expressions.
 */
export const isReactiveChild = (
  value: VNodeChild
): value is { __type__: "computed"; value: unknown; peek: () => unknown } => {
  return (
    value !== null &&
    typeof value === "object" &&
    "__type__" in value &&
    (value as any).__type__ === "computed" &&
    "value" in value &&
    "peek" in value &&
    typeof (value as { peek: unknown }).peek === "function"
  );
};
