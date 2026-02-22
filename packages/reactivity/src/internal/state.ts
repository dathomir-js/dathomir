/**
 * Owner state management for cleanup scopes.
 * @module
 */

/** Owner structure for tracking effects and cleanup functions */
interface Owner {
  effects: (() => void)[];
  cleanups: (() => void)[];
}

/** Dispose function type returned by createRoot */
type RootDispose = () => void;

let currentOwner: Owner | undefined;

/** Current effect-scope cleanup list (used by effect's internal onCleanup support) */
let currentEffectCleanups: (() => void)[] | undefined;

function getCurrentOwner(): Owner | undefined {
  return currentOwner;
}

function setCurrentOwner(owner: Owner | undefined): Owner | undefined {
  const previous = currentOwner;
  currentOwner = owner;
  return previous;
}

function getCurrentEffectCleanups(): (() => void)[] | undefined {
  return currentEffectCleanups;
}

function setCurrentEffectCleanups(
  cleanups: (() => void)[] | undefined,
): (() => void)[] | undefined {
  const previous = currentEffectCleanups;
  currentEffectCleanups = cleanups;
  return previous;
}

export {
  getCurrentEffectCleanups,
  getCurrentOwner,
  setCurrentEffectCleanups,
  setCurrentOwner,
};
export type { Owner, RootDispose };
