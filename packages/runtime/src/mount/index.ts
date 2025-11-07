import { effect } from "../reactivity";

import { mountChildren } from "./children";
import { addEventFromProp } from "./events";
import { isReactiveChild } from "./guards";
import { applyProperty } from "./props";

import type { VNode } from "@/types";

/**
 * Mount reactive property - wraps property updates in an effect
 */
const mountReactiveProp = (
  el: Element,
  key: string,
  reactive: { value: unknown; peek: () => unknown },
) => {
  effect(() => {
    applyProperty(el, key, reactive.value);
  });
};

/**
 * Core VNode -> Node conversion
 */
const mountToNode = (vNode: VNode): Node => {
  // Host element
  if (typeof vNode.t === "string") {
    const el = document.createElement(vNode.t);
    // props
    const props = vNode.p;
    if (props) {
      for (const key in props) {
        const value = props[key];
        if (key === "children") continue; // shouldn't exist, but safeguard
        // Check event props first (on* prefix is fastest check)
        if (key.startsWith("on") && key.length > 2) {
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
