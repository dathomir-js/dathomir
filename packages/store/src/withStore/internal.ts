import type { AtomStore } from "../createAtomStore/implementation";

/**
 * Browser store context implementation.
 *
 * Uses a module-global synchronous stack. Safe for single-threaded
 * browser environments where only one render boundary executes at a time.
 *
 * For Node.js / Edge builds, this file is replaced at build time via
 * resolve alias with `internal.node.ts` which uses AsyncLocalStorage.
 */
const storeStack: AtomStore[] = [];

function popStoreBoundary(store: AtomStore): void {
  const popped = storeStack.pop();
  if (popped !== store) {
    throw new Error("Store boundary stack is corrupted");
  }
}

/**
 * Returns the currently active store in the nearest `withStore` boundary,
 * or `undefined` if called outside any boundary.
 */
function getCurrentStore(): AtomStore | undefined {
  return storeStack[storeStack.length - 1];
}

/**
 * Executes `fn` within a store boundary backed by a synchronous stack.
 *
 * Pushes `store` onto the module-scoped stack before invoking `fn`, and
 * pops it in a `finally` block so the stack stays consistent even if
 * `fn` throws.
 */
function runWithStoreContext<T>(store: AtomStore, fn: () => T): T {
  storeStack.push(store);

  try {
    const result = fn();
    popStoreBoundary(store);
    return result;
  } catch (error: unknown) {
    popStoreBoundary(store);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export { getCurrentStore, runWithStoreContext };
