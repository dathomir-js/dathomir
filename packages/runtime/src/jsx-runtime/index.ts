import { Computed } from "@dathomir/reactivity";

import { VNodeFlags } from "./vNode";

import { VNodeChild, VNode, ComponentFunction, dathomirNode } from "@/types";
export type { JSX } from "@/types";

const FragmentSymbol = Symbol.for("dathomir.fragment");
export const Fragment = FragmentSymbol as unknown as ComponentFunction<{
  children?: dathomirNode;
}>;

/**
 * Check if a value is reactive (Signal/Computed).
 */
function isReactive(value: unknown): value is Computed<unknown> {
  if (value == null || typeof value !== "object") return false;
  // perform direct property checks on the narrowed value
  return (
    "__type__" in value &&
    value.__type__ === "computed" &&
    "value" in value &&
    "peek" in value
  );
}

/**
 * Normalize children into VNode array format.
 * Flattens arrays and filters out null/undefined/boolean.
 * Reactive values (Signal/Computed) are wrapped in array for consistent handling.
 */
function normalizeChildren(children: unknown): VNodeChild[] {
  if (children == null) {
    return [];
  }

  // Keep reactive values as-is in single-element array
  // (mount will detect and handle them specially)
  if (isReactive(children)) {
    return [children];
  }

  if (Array.isArray(children)) {
    return children.flat(Infinity);
  }

  return [children as VNodeChild];
}

/**
 * Compute VNode flags based on tag and props/children content.
 */
function computeFlags(
  tag: string | symbol | ComponentFunction,
  props: Record<string, any> | null | undefined,
  children: VNodeChild[],
): number {
  if (tag === FragmentSymbol) {
    return VNodeFlags.FRAGMENT;
  }

  let flags = VNodeFlags.ELEMENT;

  // Check for reactive props
  if (props) {
    for (const key in props) {
      if (isReactive(props[key])) {
        flags |= VNodeFlags.REACTIVE_PROP;
        break;
      }
    }
  }

  // Check for reactive children
  for (const child of children) {
    if (isReactive(child)) {
      flags |= VNodeFlags.REACTIVE_CHILD;
      break;
    }
  }

  return flags;
}

/**
 * JSX factory: creates VNode (pure data structure, no DOM side effects).
 * If tag is a function (component), calls it with props and returns the Computed<VNode>.
 */
function jsx(
  tag: string | ComponentFunction | symbol,
  props: Record<string, any> | null,
  key?: string | number,
): VNode | Computed<VNode> {
  // Handle component functions
  if (typeof tag === "function") {
    const componentProps = props || {};
    return tag(componentProps);
  }

  const children = normalizeChildren(props?.children);
  const { children: _, ...restProps } = props || {};

  const flags = computeFlags(tag, restProps, children);

  return {
    t: tag as string | symbol,
    p: Object.keys(restProps).length > 0 ? restProps : undefined,
    c: children.length > 0 ? children : undefined,
    k: key,
    f: flags || undefined,
  };
}

const jsxs = jsx;

export { jsx, jsxs };
