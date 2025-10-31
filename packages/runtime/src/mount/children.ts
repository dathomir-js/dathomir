import { effect } from "../reactivity";

import { isReactiveChild } from "./guards";

import type { VNode, VNodeChild } from "@/types";

/**
 * Mount children (static + reactive) with range anchor for reactive nodes.
 * Reactive children use Range API for efficient DOM updates.
 */
const mountChildren = (
  parent: Element | DocumentFragment,
  children: VNodeChild[] | undefined,
  mountToNode: (vnode: VNode) => Node
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
        const produce = (val: unknown): Node[] => {
          if (Array.isArray(val)) return val.flatMap(produce);
          if (typeof val === "string" || typeof val === "number")
            return [document.createTextNode(String(val))];
          if (val === null || val === undefined || val === false) return [];
          if (typeof val === "object" && val && (val as any).t) {
            // VNode
            return [mountToNode(val as VNode)];
          }
          if (val instanceof Node) return [val];
          return [];
        };
        cleanup();
        const nextNodes = produce(v);
        insertNodes(nextNodes);
      });
      continue;
    }
    if (typeof child === "string" || typeof child === "number") {
      parent.appendChild(document.createTextNode(String(child)));
      continue;
    }
    if (typeof child === "object" && child && (child as any).t) {
      parent.appendChild(mountToNode(child as VNode));
      continue;
    }
  }
};

export { mountChildren };
