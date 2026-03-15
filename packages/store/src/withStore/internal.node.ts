import { AsyncLocalStorage } from "node:async_hooks";

import type { AtomStore } from "../createAtomStore/implementation";

/**
 * Node.js / Edge store context implementation.
 *
 * Uses AsyncLocalStorage to provide per-request isolation. Each
 * `runWithStoreContext` call creates a new ALS context with the store
 * appended to the inherited stack. This ensures:
 *
 * - Concurrent SSR requests never leak stores across request boundaries.
 * - Async callbacks within the same request automatically inherit the
 *   store context (microtasks, setTimeout, await, etc.).
 * - Nested `withStore` calls properly shadow the outer store.
 */
const als = new AsyncLocalStorage<AtomStore[]>();

/**
 * Returns the currently active store in the nearest `withStore` boundary,
 * or `undefined` if called outside any boundary (or outside an ALS context).
 */
function getCurrentStore(): AtomStore | undefined {
  const stack = als.getStore();
  if (stack === undefined || stack.length === 0) {
    return undefined;
  }
  return stack[stack.length - 1];
}

/**
 * Executes `fn` within a store boundary backed by AsyncLocalStorage.
 *
 * Creates a new ALS context with `store` appended to the inherited stack.
 * Nested calls inherit the parent stack and append their own store.
 * The ALS context is automatically cleaned up when `fn` returns or throws.
 */
function runWithStoreContext<T>(store: AtomStore, fn: () => T): T {
  const parentStack = als.getStore() ?? [];
  return als.run([...parentStack, store], fn);
}

export { getCurrentStore, runWithStoreContext };
