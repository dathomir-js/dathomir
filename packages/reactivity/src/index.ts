import {
  createReactiveSystem,
  type Link,
  ReactiveFlags,
  type ReactiveNode,
} from "alien-signals/system";

/**
 * Describes a direct value or updater function that can be applied to a signal.
 * @template T
 */
type SignalUpdate<T> = T | ((previous: T) => T);

/**
 * Reactive container that tracks reads and notifies dependents on change.
 * @template T
 */
interface Signal<T> {
  /**
   * Current value of the signal. Reading this accessor registers a dependency.
   */
  readonly value: T;
  /**
   * Replace the signal's value without reading it.
   * @param value Direct value or updater to apply.
   */
  set(value: SignalUpdate<T>): void;
  /**
   * Update the signal using a read-only view of the previous value.
   * @param updater Function that maps the previous value to the next value.
   */
  update(updater: (previous: T) => T): void;
  /**
   * Read the current value without tracking the access.
   */
  peek(): T;
  readonly __type__: "signal";
}

/**
 * Lazily evaluated value that caches its latest computation until inputs change.
 * @template T
 */
interface Computed<T> {
  /**
   * Derived value that tracks dependencies when read.
   */
  readonly value: T;
  /**
   * Read the current cached value without tracking.
   */
  peek(): T;
  readonly __type__: "computed";
}

/**
 * Function returned by {@link effect} that removes the effect's subscriptions.
 */
type EffectCleanup = () => void;

type NodeKind = "signal" | "computed" | "effect" | "scope";

interface BaseNode extends ReactiveNode {
  kind: NodeKind;
}

interface SignalNode<T> extends BaseNode {
  kind: "signal";
  previousValue: T;
  value: T;
}

interface ComputedNode<T = unknown> extends BaseNode {
  kind: "computed";
  value: T | undefined;
  getter: (previousValue?: unknown) => unknown;
}

interface EffectNode extends BaseNode {
  kind: "effect";
  fn: () => void;
}

interface EffectScopeNode extends BaseNode {
  kind: "scope";
}

type WatcherNode = EffectNode | EffectScopeNode;

const queuedEffects: (WatcherNode | undefined)[] = [];

const QUEUED_FLAG = 1 << 6;

const { link, unlink, propagate, checkDirty, shallowPropagate } =
  createReactiveSystem({
    update(node: SignalNode<unknown> | ComputedNode<unknown>): boolean {
      return node.kind === "computed"
        ? updateComputed(node)
        : updateSignal(node, node.value);
    },
    notify(node: WatcherNode) {
      notifyWatcher(node);
    },
    unwatched(node: SignalNode<unknown> | ComputedNode<unknown> | WatcherNode) {
      if (node.kind === "computed") {
        let toRemove = node.deps;
        if (toRemove !== undefined) {
          do {
            toRemove = unlink(toRemove, node);
          } while (toRemove !== undefined);
        }
      } else if (node.kind === "effect") {
        effectOper.call(node);
      } else if (node.kind === "scope") {
        effectScopeOper.call(node);
      }
    },
  });

let cycle = 0;
let batchDepth = 0;
let notifyIndex = 0;
let queuedEffectsLength = 0;
let activeSub: BaseNode | undefined;

function setActiveSub(sub: BaseNode | undefined) {
  const previous = activeSub;
  activeSub = sub;
  return previous;
}

function unsetActiveSub(previous: BaseNode | undefined) {
  activeSub = previous;
}

function startBatch() {
  ++batchDepth;
}

function endBatch() {
  if (!--batchDepth) {
    flush();
  }
}

function scheduleWatcher(node: WatcherNode) {
  const flags = node.flags;
  if (!(flags & QUEUED_FLAG)) {
    node.flags = flags | QUEUED_FLAG;
    const subs = node.subs;
    if (subs !== undefined) {
      notifyWatcher(subs.sub as WatcherNode);
    } else {
      queuedEffects[queuedEffectsLength++] = node;
    }
  }
}

function notifyWatcher(node: WatcherNode) {
  scheduleWatcher(node);
}

function runWatcher(node: WatcherNode, flags: ReactiveFlags): void {
  if (
    flags & ReactiveFlags.Dirty ||
    (flags & ReactiveFlags.Pending &&
      (checkDirty(node.deps!, node) ||
        ((node.flags = flags & ~ReactiveFlags.Pending), false)))
  ) {
    ++cycle;
    node.depsTail = undefined;
    node.flags =
      (node.flags & ~(ReactiveFlags.Dirty | ReactiveFlags.Pending)) |
      ReactiveFlags.Watching |
      ReactiveFlags.RecursedCheck;
    const prevSub = setActiveSub(node);
    try {
      (node as EffectNode).fn?.();
    } finally {
      unsetActiveSub(prevSub);
      node.flags &= ~ReactiveFlags.RecursedCheck;
      purgeDeps(node);
    }
  } else {
    let linkNode = node.deps;
    while (linkNode !== undefined) {
      const dep = linkNode.dep as BaseNode;
      const depFlags = dep.flags;
      if (depFlags & QUEUED_FLAG) {
        runWatcher(dep as WatcherNode, (dep.flags = depFlags & ~QUEUED_FLAG));
      }
      linkNode = linkNode.nextDep;
    }
  }
}

function flush() {
  while (notifyIndex < queuedEffectsLength) {
    const watcher = queuedEffects[notifyIndex]!;
    queuedEffects[notifyIndex++] = undefined;
    runWatcher(watcher, (watcher.flags &= ~QUEUED_FLAG));
  }
  notifyIndex = 0;
  queuedEffectsLength = 0;
}

function updateComputed<T>(computed: ComputedNode<T>): boolean {
  ++cycle;
  computed.depsTail = undefined;
  computed.flags = ReactiveFlags.Mutable | ReactiveFlags.RecursedCheck;
  const prevSub = setActiveSub(computed);
  try {
    const oldValue = computed.value;
    return oldValue !== (computed.value = computed.getter(oldValue) as T);
  } finally {
    unsetActiveSub(prevSub);
    computed.flags &= ~ReactiveFlags.RecursedCheck;
    purgeDeps(computed);
  }
}

function updateSignal<T>(signal: SignalNode<T>, value: T): boolean {
  signal.flags = ReactiveFlags.Mutable;
  return signal.previousValue !== (signal.previousValue = value);
}

function purgeDeps(sub: BaseNode) {
  const depsTail = sub.depsTail as Link | undefined;
  let toRemove = depsTail !== undefined ? depsTail.nextDep : sub.deps;
  while (toRemove !== undefined) {
    toRemove = unlink(toRemove, sub);
  }
}

function computedOper<T>(this: ComputedNode<T>): T {
  const flags = this.flags;
  if (
    flags & ReactiveFlags.Dirty ||
    (flags & ReactiveFlags.Pending &&
      (checkDirty(this.deps!, this) ||
        ((this.flags = flags & ~ReactiveFlags.Pending), false)))
  ) {
    if (updateComputed(this)) {
      const subs = this.subs;
      if (subs !== undefined) {
        shallowPropagate(subs);
      }
    }
  } else if (!flags) {
    this.flags = ReactiveFlags.Mutable;
    const prevSub = setActiveSub(this);
    try {
      this.value = this.getter() as T;
    } finally {
      unsetActiveSub(prevSub);
    }
  }
  const sub = activeSub;
  if (sub !== undefined) {
    link(this, sub, cycle);
  }
  return this.value!;
}

function signalOper<T>(this: SignalNode<T>, ...value: [] | [T]): T | void {
  if (value.length) {
    if (this.value !== (this.value = value[0])) {
      this.flags = ReactiveFlags.Mutable | ReactiveFlags.Dirty;
      const subs = this.subs;
      if (subs !== undefined) {
        propagate(subs);
        if (!batchDepth) {
          flush();
        }
      }
    }
  } else {
    const current = this.value;
    if (this.flags & ReactiveFlags.Dirty) {
      if (updateSignal(this, current)) {
        const subs = this.subs;
        if (subs !== undefined) {
          shallowPropagate(subs);
        }
      }
    }
    let sub = activeSub;
    while (sub !== undefined) {
      if (sub.flags & (ReactiveFlags.Mutable | ReactiveFlags.Watching)) {
        link(this, sub, cycle);
        break;
      }
      sub = sub.subs?.sub as BaseNode | undefined;
    }
    return current;
  }
}

function effectOper(this: EffectNode): void {
  effectScopeOper.call(this);
  this.flags = ReactiveFlags.None;
}

function effectScopeOper(this: EffectScopeNode | EffectNode): void {
  let dep = this.deps;
  while (dep !== undefined) {
    dep = unlink(dep, this);
  }
  const sub = this.subs;
  if (sub !== undefined) {
    unlink(sub);
  }
}

function withNoTracking<T>(fn: () => T): T {
  if (activeSub === undefined) {
    return fn();
  }
  const prev = setActiveSub(undefined);
  try {
    return fn();
  } finally {
    unsetActiveSub(prev);
  }
}

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

function createComputedNode<T>(
  getter: (previousValue?: T) => T
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

function createSignalApi<T>(node: SignalNode<T>): Signal<T> {
  const readTracked = () => signalOper.call(node) as T;
  const readUntracked = () => withNoTracking(() => signalOper.call(node) as T);
  const write = (value: T) => {
    signalOper.call(node, value);
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

function createComputedApi<T>(node: ComputedNode<T>): Computed<T> {
  const readTracked = () => computedOper.call(node) as T;
  const readUntracked = () =>
    withNoTracking(() => computedOper.call(node) as T);
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
 * Create a mutable signal that tracks reads and notifies dependents on updates.
 * @template T
 * @param {T} initialValue Initial value stored in the signal.
 * @returns {Signal<T>} Reactive signal instance.
 */
function signal<T>(initialValue: T): Signal<T>;
function signal<T = undefined>(initialValue?: T): Signal<T> {
  return createSignalApi(createSignalNode(initialValue as T));
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

/**
 * Register a reactive side-effect that re-runs when tracked dependencies change.
 * @param {() => void} fn Effect function to execute and track.
 * @returns {EffectCleanup} Cleanup function that stops the effect.
 */
function effect(fn: () => void): EffectCleanup {
  const effectNode = createEffectNode(fn);
  const prevSub = setActiveSub(effectNode);
  if (prevSub !== undefined) {
    link(effectNode, prevSub, 0);
  }
  try {
    fn();
  } finally {
    unsetActiveSub(prevSub);
  }
  return effectOper.bind(effectNode);
}

/**
 * Execute a callback while batching signal notifications into a single flush.
 * @template T
 * @param {() => T} fn Callback to run within the batch.
 * @returns {T} Result of the callback.
 */
function batch<T>(fn: () => T): T {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}

export type { SignalUpdate, Signal, Computed, EffectCleanup };
export { signal, computed, effect, batch };
