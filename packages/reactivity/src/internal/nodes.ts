/**
 * Node types for the reactive system.
 * @module
 */
import type { Link, ReactiveFlags } from "alien-signals/system";

/** Base node structure shared by all reactive nodes */
interface BaseNode {
  subs: Link | undefined;
  subsTail: Link | undefined;
  deps: Link | undefined;
  depsTail: Link | undefined;
  flags: ReactiveFlags;
}

/** Signal node - mutable reactive value */
interface SignalNode<T = unknown> extends BaseNode {
  kind: "signal";
  value: T;
  previousValue: T;
}

/** Computed node - derived reactive value */
interface ComputedNode<T = unknown> extends BaseNode {
  kind: "computed";
  value: T | undefined;
  getter: (previousValue?: unknown) => unknown;
}

/** Effect node - reactive side effect */
interface EffectNode extends BaseNode {
  kind: "effect";
  fn: () => void;
}

/** Effect scope node - for grouping effects */
interface EffectScopeNode extends BaseNode {
  kind: "scope";
}

/** Union of watcher node types */
type WatcherNode = EffectNode | EffectScopeNode;

export type {
  BaseNode,
  ComputedNode,
  EffectNode,
  EffectScopeNode,
  SignalNode,
  WatcherNode,
};
