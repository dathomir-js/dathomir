/**
 * Signal implementation - mutable reactive value.
 * @module
 */
import { ReactiveFlags } from "alien-signals/system";

import { createSignalNode, withNoTracking } from "../internal/helpers";
import type { BaseNode, SignalNode } from "../internal/nodes";
import {
  flush,
  getActiveSub,
  getBatchDepth,
  link,
  propagate,
  shallowPropagate,
  updateSignal,
} from "../internal/system";
import type { Signal } from "../types";

function signalOper<T>(node: SignalNode<T>, ...value: [] | [T]): T | void {
  if (value.length) {
    const oldValue = node.value;
    node.value = value[0];
    if (!Object.is(oldValue, node.value)) {
      node.flags = ReactiveFlags.Mutable | ReactiveFlags.Dirty;
      const subs = node.subs;
      if (subs !== undefined) {
        propagate(subs);
        if (!getBatchDepth()) {
          flush();
        }
      }
    }
  } else {
    const current = node.value;
    if (node.flags & ReactiveFlags.Dirty) {
      if (updateSignal(node, current)) {
        const subs = node.subs;
        if (subs !== undefined) {
          shallowPropagate(subs);
        }
      }
    }
    let sub = getActiveSub();
    while (sub !== undefined) {
      if (sub.flags & (ReactiveFlags.Mutable | ReactiveFlags.Watching)) {
        link(node, sub, 0);
        break;
      }
      sub = sub.subs?.sub as BaseNode | undefined;
    }
    return current;
  }
}

function createSignalApi<T>(node: SignalNode<T>): Signal<T> {
  const readTracked = () => signalOper(node) as T;
  const readUntracked = () => withNoTracking(() => signalOper(node) as T);
  const write = (value: T) => {
    signalOper(node, value);
  };
  return {
    get value() {
      return readTracked();
    },
    set value(value) {
      write(value);
    },
    set(update) {
      const nextValue =
        typeof update === "function"
          ? (update as (prev: T) => T)(readUntracked())
          : update;
      write(nextValue as T);
    },
    update(updater) {
      this.set(updater);
    },
    peek() {
      return readUntracked();
    },
    __type__: "signal",
  };
}

/**
 * Create a mutable signal that tracks reads and notifies dependents on updates.
 * @template T
 * @param {T} initialValue Initial value stored in the signal.
 * @returns {Signal<T>} Reactive signal instance.
 */
function signal<T>(initialValue: T): Signal<T>;
function signal<T = undefined>(initialValue?: T): Signal<T> {
  return createSignalApi(createSignalNode(initialValue as T));
}

export { signal };
