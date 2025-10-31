import { FragmentSymbol } from "../jsx-runtime";
import { effect } from "../reactivity";

import { mountChildren } from "./children";
import { addEventFromProp, eventNameFromProp } from "./events";
import { isReactiveChild } from "./guards";
import { applyProperty } from "./props";

import type { VNode, ComponentFn } from "@/types";

/**
 * Mount reactive property - wraps property updates in an effect
 */
const mountReactiveProp = (
  el: Element,
  key: string,
  reactive: { value: unknown; peek: () => unknown }
) => {
  effect(() => {
    applyProperty(el, key, reactive.value);
  });
};

/**
 * Core VNode -> Node conversion
 */
const mountToNode = (vNode: VNode): Node => {
  // Component
  if (typeof vNode.t === "function") {
    const rendered = (vNode.t as ComponentFn)(vNode.p);
    return mountToNode(rendered);
  }
  // Fragment
  if (vNode.t === FragmentSymbol) {
    const frag = document.createDocumentFragment();
    mountChildren(frag, vNode.c, mountToNode);
    return frag;
  }
  // Host element
  if (typeof vNode.t === "string") {
    const el = document.createElement(vNode.t);
    // props
    const props = vNode.p;
    if (props) {
      for (const key in props) {
        const value = props[key];
        if (key === "children") continue; // shouldn't exist, but safeguard
        // Check event props first before reactive prop handling
        if (eventNameFromProp(key)) {
          addEventFromProp(el, key, value);
          continue;
        }
        if (isReactiveChild(value)) {
          mountReactiveProp(el, key, value);
          continue;
        }
        applyProperty(el, key, value);
      }
    }
    mountChildren(el, vNode.c, mountToNode);
    return el;
  }
  // Fallback (shouldn't happen for well-formed VNode)
  return document.createTextNode("");
};

/**
 * Public API: mount a VNode tree into a container element
 */
const mount = (vNode: VNode, container: Element) => {
  const node = mountToNode(vNode);
  container.appendChild(node);
  return node;
};

export { mount, mountToNode, mountReactiveProp };
