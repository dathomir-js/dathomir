import { Computed, effect } from "@dathomir/reactivity";

import { Fragment } from "@/jsx-runtime";
import { VNode, VNodeChild } from "@/types";
import { isReactiveChild, isVNode } from "@/utils";

/**
 * Helper to flatten children into DOM nodes.
 * Handles arrays, primitives, reactive values, and VNodes.
 */
const flattenToNodes = (
  val: unknown,
  mountToNode: (vnode: VNode | Computed<VNode>) => Node | DocumentFragment,
  result: Node[],
) => {
  if (val === null || val === undefined || val === false) return;

  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      flattenToNodes(val[i], mountToNode, result);
    }
    return;
  }

  if (typeof val === "string" || typeof val === "number") {
    result.push(document.createTextNode(String(val)));
    return;
  }

  // Handle reactive values (computed wrapped)
  if (isReactiveChild(val)) {
    flattenToNodes(val.value, mountToNode, result);
    return;
  }

  if (isVNode(val)) {
    // VNode
    result.push(mountToNode(val));
    return;
  }

  if (val instanceof Node) {
    result.push(val);
    return;
  }
};

/**
 * Mount children (static + reactive) with range anchor for reactive nodes.
 * Reactive children use Range API for efficient DOM updates.
 */
const mountChildren = (
  parent: Element | DocumentFragment,
  children: VNodeChild[] | undefined,
  mountToNode: (vnode: VNode | Computed<VNode>) => Node | DocumentFragment,
) => {
  if (!children || children.length === 0) return;
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (isReactiveChild(child)) {
      // Anchor range
      const range = document.createRange();
      const endIndex = parent.childNodes.length;
      range.setStart(parent, endIndex);
      range.setEnd(parent, endIndex);
      let current: Node[] = [];
      const cleanup = () => {
        if (current.length === 0) return;
        const first = current[0];
        const last = current[current.length - 1];
        if (first.parentNode !== parent || last.parentNode !== parent) {
          current = [];
          return;
        }
        range.setStartBefore(first);
        range.setEndAfter(last);
        range.deleteContents();
        current = [];
      };
      const insertNodes = (nodes: Node[]) => {
        if (nodes.length === 0) {
          cleanup();
          return;
        }
        const frag = document.createDocumentFragment();
        for (const n of nodes) frag.appendChild(n);
        range.insertNode(frag);
        range.setStartBefore(nodes[0]);
        range.setEndAfter(nodes[nodes.length - 1]);
        current = nodes;
      };
      effect(() => {
        const v = child.value;
        if (typeof v === "string" || typeof v === "number") {
          const text = String(v);
          if (current.length === 1 && current[0] instanceof Text) {
            current[0].data = text;
            return;
          }
          cleanup();
          insertNodes([document.createTextNode(text)]);
          return;
        }
        if (v === null || v === undefined || v === false) {
          cleanup();
          return;
        }
        const nextNodes: Node[] = [];
        flattenToNodes(v, mountToNode, nextNodes);
        cleanup();
        insertNodes(nextNodes);
      });
      continue;
    }
    if (typeof child === "string" || typeof child === "number") {
      parent.appendChild(document.createTextNode(String(child)));
      continue;
    }
    // Handle reactive child at top level
    if (Array.isArray(child)) {
      // Process array elements that might be reactive
      mountChildren(parent, child, mountToNode);
      continue;
    }
    if (typeof child === "object" && child && (child as any).t) {
      const vNode = child as VNode;
      // Optimization: Flatten Fragments to avoid DocumentFragment creation
      if (vNode.t === (Fragment as any)) {
        mountChildren(parent, vNode.c, mountToNode);
        continue;
      }
      parent.appendChild(mountToNode(vNode));
      continue;
    }
  }
};

export { mountChildren };
