/**
 * VNode type and flags for unified JSX representation (CSR/SSR).
 */

/**
 * Key type for VNode identification (used in hydration/diffing).
 */
/**
 * NOTE: Only Computed reactive nodes can appear directly in children (Signals are
 * expected to be accessed inside Computed wrappers by the transformer). We import
 * the Computed type here to express that possibility explicitly.
 */

import type { Computed } from "@dathomir/reactivity";

/** Key type for VNode identification (used in hydration/diffing). */
type Key = string | number;

/**
 * Component function type: accepts props and returns VNode.
 */
type ComponentFn<P = any> = (props?: P) => VNode;

/**
 * VNode: Virtual node representing JSX element structure.
 * Pure data structure with no side effects (DOM operations happen in mount).
 */
/**
 * Child node types allowed inside a VNode. Only Computed (not raw Signal) can
 * appear reactively at top-level children because the transformer wraps JSX
 * expressions.
 */
type VNodeChild =
  | VNode
  | Computed<unknown>
  | string
  | number
  | boolean
  | null
  | undefined;

interface VNode {
  /**
   * Tag: string (host element), ComponentFn, or FragmentSymbol.
   */
  t: string | ComponentFn | symbol;

  /**
   * Props (excluding children). May contain reactive values.
   */
  p?: Record<string, any>;

  /**
   * Children: array of VNode, primitives, or reactive nodes.
   */
  /**
   * Children: array of VNodes, primitives, or a Computed reactive wrapper.
   *
   * The transformer guarantees expressions become `computed(() => ...)`, so
   * only Computed nodes (not raw Signal) are expected at the top-level of `c`.
   */
  c?: VNodeChild[];

  /**
   * Key for stable identity in lists/hydration.
   */
  k?: Key;

  /**
   * Flags: bitmask of VNodeFlags for type/optimization hints.
   * Can be a single flag or OR-combined multiple flags (e.g., ELEMENT | REACTIVE_PROP).
   */
  f?: number;
}

export type { VNode, VNodeChild, ComponentFn, Key };
