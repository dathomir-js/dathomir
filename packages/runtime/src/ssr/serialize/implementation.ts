/**
 * State serialization for SSR.
 *
 * Per SPEC.typ (ADR: 状態転送のエスケープ規約):
 * - Uses devalue library for XSS-safe serialization
 * - Supports Date, RegExp, Map, Set, BigInt, circular references
 * - Signal initial values only (computed values are recalculated on CSR)
 */

import { stringify } from "devalue";

/**
 * State value that can be serialized.
 * Excludes functions and symbols.
 */
type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | RegExp
  | Map<SerializableValue, SerializableValue>
  | Set<SerializableValue>
  | bigint
  | SerializableValue[]
  | { [key: string]: SerializableValue };

/**
 * State object containing Signal initial values.
 */
type StateObject = Record<string, SerializableValue>;

/**
 * Serialize state for SSR transfer.
 * Uses devalue for XSS-safe serialization.
 */
function serializeState(state: StateObject): string {
  return stringify(state);
}

/**
 * Check if a value is serializable.
 */
function isSerializable(value: unknown): value is SerializableValue {
  if (value === null || value === undefined) return true;

  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") return true;
  if (type === "bigint") return true;
  if (type === "function" || type === "symbol") return false;

  if (value instanceof Date) return true;
  if (value instanceof RegExp) return true;
  if (value instanceof Map) {
    for (const [k, v] of value.entries()) {
      if (!isSerializable(k) || !isSerializable(v)) return false;
    }
    return true;
  }
  if (value instanceof Set) {
    for (const item of value) {
      if (!isSerializable(item)) return false;
    }
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isSerializable);
  }

  if (type === "object") {
    return Object.values(value as object).every(isSerializable);
  }

  return false;
}

export { isSerializable, serializeState };
export type { SerializableValue, StateObject };
