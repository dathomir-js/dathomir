/**
 * Type representing a reactive value (Signal or Computed).
 */
type Reactive<T = unknown> = {
  __type__: "signal" | "computed";
  value: T;
  peek(): T;
};

/**
 * Recursively unwrap reactive types to their static equivalents.
 * @template T - The type to unwrap
 */
type Unwrap<T> = T extends Reactive<infer U>
  ? Unwrap<U>
  : T extends (infer U)[]
  ? Unwrap<U>[]
  : T extends object
  ? T extends Date | RegExp | Map<any, any> | Set<any> | Function
    ? T
    : { [K in keyof T]: Unwrap<T[K]> }
  : T;

/**
 * Options for controlling the behavior of toUnreactive.
 */
interface ToUnreactiveOptions {
  /**
   * Maximum depth to traverse when unwrapping nested structures.
   * @default Infinity
   */
  maxDepth?: number;

  /**
   * Callback invoked when a circular reference is detected.
   * If not provided, the original value is returned for circular references.
   * @param value - The value that caused the circular reference.
   * @returns The value to use in place of the circular reference.
   */
  onCircular?: (value: unknown) => unknown;
}

/**
 * Type guard to check if a value is a reactive object (Signal or Computed).
 */
const isReactive = (
  value: unknown
): value is { __type__: "signal" | "computed"; peek(): unknown } => {
  return (
    value !== null &&
    typeof value === "object" &&
    "__type__" in value &&
    (value.__type__ === "signal" || value.__type__ === "computed") &&
    "peek" in value &&
    typeof value.peek === "function"
  );
};

/**
 * Type guard to check if a value is a plain object (not Array, Date, RegExp, etc.).
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Convert reactive values (Signal/Computed) to their static unreactive equivalents.
 * Recursively processes arrays and plain objects, unwrapping all reactive values found.
 *
 * @template T
 * @param value - The value to convert. Can be a primitive, reactive value, array, or object.
 * @param options - Optional configuration for depth limits and circular reference handling.
 * @returns The unreactive equivalent of the input value.
 *
 * @example
 * ```ts
 * const count = signal(42);
 * const doubled = computed(() => count.value * 2);
 * const data = { count, doubled, nested: { values: [count] } };
 *
 * const static = toUnreactive(data);
 * // { count: 42, doubled: 84, nested: { values: [42] } }
 * ```
 *
 * @example
 * // With circular reference handling
 * ```ts
 * const obj: any = { name: signal("test") };
 * obj.self = obj;
 *
 * const result = toUnreactive(obj, {
 *   onCircular: () => "[Circular]"
 * });
 * // { name: "test", self: "[Circular]" }
 * ```
 *
 * @example
 * // With depth limit
 * ```ts
 * const deep = { a: { b: { c: signal(1) } } };
 * const result = toUnreactive(deep, { maxDepth: 1 });
 * // { a: { b: { c: [Signal object] } } } - stops at depth 1
 * ```
 */
function toUnreactive<T>(value: T, options?: ToUnreactiveOptions): Unwrap<T> {
  const maxDepth = options?.maxDepth ?? Infinity;
  const visited = new WeakMap<object, any>();

  const inner = (val: unknown, depth: number): any => {
    // Depth limit check
    if (depth > maxDepth) {
      return val;
    }

    // Reactive unwrapping (Signal/Computed)
    if (isReactive(val)) {
      try {
        const unwrapped = val.peek();
        // Recursively unwrap the peeked value
        return inner(unwrapped, depth + 1);
      } catch {
        // If peek() throws, return the original reactive object
        return val;
      }
    }

    // Primitive types - return as-is
    if (
      val === null ||
      val === undefined ||
      typeof val === "string" ||
      typeof val === "number" ||
      typeof val === "boolean" ||
      typeof val === "bigint" ||
      typeof val === "symbol" ||
      typeof val === "function"
    ) {
      return val;
    }

    // Array unwrapping
    if (Array.isArray(val)) {
      // Circular reference check
      if (visited.has(val)) {
        return options?.onCircular?.(val) ?? visited.get(val);
      }

      const result: any[] = [];
      visited.set(val, result);

      for (let i = 0; i < val.length; i++) {
        result[i] = inner(val[i], depth + 1);
      }

      return result;
    }

    // Plain object unwrapping
    if (isPlainObject(val)) {
      // Circular reference check
      if (visited.has(val)) {
        return options?.onCircular?.(val) ?? visited.get(val);
      }

      const result: Record<string, any> = {};
      visited.set(val, result);

      for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
          result[key] = inner(val[key], depth + 1);
        }
      }

      return result;
    }

    // Other types (Date, RegExp, Map, Set, DOM nodes, etc.) - return as-is
    return val;
  };

  return inner(value, 0) as Unwrap<T>;
}

export type { Reactive, Unwrap, ToUnreactiveOptions };
export { toUnreactive };
