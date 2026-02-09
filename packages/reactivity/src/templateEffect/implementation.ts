/**
 * templateEffect implementation - effect that is tracked by owner scope.
 * @module
 */
import { effect } from "../effect/implementation";
import { getCurrentOwner } from "../internal/state";

/**
 * Register a template effect that re-runs when tracked dependencies change.
 * Unlike `effect`, this is designed for template updates and is automatically
 * tracked by the current owner scope (createRoot).
 * @param {() => void} fn Effect function to execute and track.
 */
function templateEffect(fn: () => void): void {
  const cleanup = effect(fn);
  const owner = getCurrentOwner();
  if (owner !== undefined) {
    owner.effects.push(cleanup);
  }
}

export { templateEffect };
