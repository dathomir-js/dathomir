/**
 * Computed implementation - cached derived reactive value.
 * @module
 */
import { ReactiveFlags } from "alien-signals/system";

import { createComputedNode, withNoTracking } from "../internal/helpers";
import type { ComputedNode } from "../internal/nodes";
import {
  checkDirty,
  getActiveSub,
  link,
  setActiveSub,
  shallowPropagate,
  unsetActiveSub,
  updateComputed,
} from "../internal/system";
import type { Computed } from "../types";

function computedOper<T>(node: ComputedNode<T>): T {
  const flags = node.flags;
  if (
    flags & ReactiveFlags.Dirty ||
    (flags & ReactiveFlags.Pending &&
      (checkDirty(node.deps!, node) ||
        ((node.flags = flags & ~ReactiveFlags.Pending), false)))
  ) {
    if (updateComputed(node)) {
      const subs = node.subs;
      if (subs !== undefined) {
        shallowPropagate(subs);
      }
    }
  } else if (!flags) {
    node.flags = ReactiveFlags.Mutable | ReactiveFlags.RecursedCheck;
    const prevSub = setActiveSub(node);
    let succeeded = false;
    try {
      node.value = node.getter(node.value) as T;
      succeeded = true;
    } finally {
      unsetActiveSub(prevSub);
      node.flags &= ~ReactiveFlags.RecursedCheck;
      if (!succeeded) {
        node.flags |= ReactiveFlags.Dirty;
      }
    }
  }
  const sub = getActiveSub();
  if (sub !== undefined) {
    link(node, sub, 0);
  }
  return node.value as T;
}

function createComputedApi<T>(node: ComputedNode<T>): Computed<T> {
  const readTracked = () => computedOper(node) as T;
  const readUntracked = () => withNoTracking(() => computedOper(node) as T);
  return {
    get value() {
      return readTracked();
    },
    peek() {
      return readUntracked();
    },
    __type__: "computed",
  };
}

/**
 * Create a cached derived value that recomputes when tracked dependencies change.
 * @template T
 * @param {(previousValue?: T) => T} getter Function that produces the derived value.
 * @returns {Computed<T>} Lazily evaluated computed value.
 */
function computed<T>(getter: (previousValue?: T) => T): Computed<T> {
  return createComputedApi(createComputedNode(getter));
}

export { computed };
