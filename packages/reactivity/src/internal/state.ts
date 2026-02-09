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

function getCurrentOwner(): Owner | undefined {
  return currentOwner;
}

function setCurrentOwner(owner: Owner | undefined): Owner | undefined {
  const previous = currentOwner;
  currentOwner = owner;
  return previous;
}

export { getCurrentOwner, setCurrentOwner };
export type { Owner, RootDispose };
