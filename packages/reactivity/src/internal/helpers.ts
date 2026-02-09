/**
 * Helper functions for reactive node creation and tracking.
 * @module
 */
import { ReactiveFlags } from "alien-signals/system";

import type { ComputedNode, EffectNode, SignalNode } from "./nodes";
import { getActiveSub, setActiveSub, unsetActiveSub } from "./system";

/**
 * Execute a function without tracking dependencies.
 */
function withNoTracking<T>(fn: () => T): T {
  if (getActiveSub() === undefined) {
    return fn();
  }
  const prev = setActiveSub(undefined);
  try {
    return fn();
  } finally {
    unsetActiveSub(prev);
  }
}

/**
 * Create a signal node with initial value.
 */
function createSignalNode<T>(initialValue: T): SignalNode<T> {
  return {
    kind: "signal",
    previousValue: initialValue,
    value: initialValue,
    subs: undefined,
    subsTail: undefined,
    deps: undefined,
    depsTail: undefined,
    flags: ReactiveFlags.Mutable,
  };
}

/**
 * Create a computed node with getter function.
 */
function createComputedNode<T>(
  getter: (previousValue?: T) => T,
): ComputedNode<T> {
  return {
    kind: "computed",
    value: undefined,
    getter: getter as (previousValue?: unknown) => unknown,
    subs: undefined,
    subsTail: undefined,
    deps: undefined,
    depsTail: undefined,
    flags: ReactiveFlags.None,
  };
}

/**
 * Create an effect node with effect function.
 */
function createEffectNode(fn: () => void): EffectNode {
  return {
    kind: "effect",
    fn,
    subs: undefined,
    subsTail: undefined,
    deps: undefined,
    depsTail: undefined,
    flags: ReactiveFlags.Watching,
  };
}

export {
  createComputedNode,
  createEffectNode,
  createSignalNode,
  withNoTracking,
};
