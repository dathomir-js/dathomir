/**
 * onCleanup implementation - register cleanup function in current scope.
 * @module
 */
import { getCurrentOwner } from "../internal/state";

/**
 * Register a cleanup function to be called when the current root is disposed.
 * Must be called within a createRoot scope.
 * @param {() => void} fn Cleanup function to register.
 */
function onCleanup(fn: () => void): void {
  const owner = getCurrentOwner();
  if (owner !== undefined) {
    owner.cleanups.push(fn);
  }
}

export { onCleanup };
