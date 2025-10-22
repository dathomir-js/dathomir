/**
 * Minimal reactive contract provided by the runtime. Values expose the current
 * snapshot through {@link ReactiveLike.value} and allow peeking without
 * tracking.
 */
type ReactiveLike<T = unknown> = {
  readonly value: T;
  peek: () => T;
};

/**
 * Narrow a value into a runtime reactive wrapper produced by @dathomir/reactivity.
 */
const isReactiveNode = (value: unknown): value is ReactiveLike => {
  return (
    value !== null &&
    typeof value === "object" &&
    "value" in value &&
    "peek" in value &&
    typeof (value as { peek: unknown }).peek === "function"
  );
};

/**
 * Check whether a value is a DOM `Node` instance.
 */
const isDomNode = (value: unknown): value is Node => {
  return value instanceof Node;
};

export type { ReactiveLike };
export { isReactiveNode, isDomNode };
