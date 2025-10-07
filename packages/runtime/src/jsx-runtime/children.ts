import { effect } from "../reactivity";
import { isDomNode, isReactiveNode } from "./guards";
import type { ReactiveLike } from "./guards";

/**
 * Convert JSX child input into DOM nodes that can be appended.
 */
const createNodesFromValue = (value: unknown): Node[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => createNodesFromValue(item));
  }

  if (typeof value === "string" || typeof value === "number") {
    return [document.createTextNode(String(value))];
  }

  if (typeof value === "boolean" || value === null || value === undefined) {
    return [];
  }

  if (isDomNode(value)) {
    return [value];
  }

  return [];
};

/**
 * Mount a reactive child by inserting an anchor and reacting to value changes.
 */
const mountReactiveChild = (parent: Element, reactiveChild: ReactiveLike) => {
  const anchor = document.createComment("ailuros:placeholder");
  parent.appendChild(anchor);
  let currentNodes: Node[] = [];

  const cleanupCurrentNodes = () => {
    for (const node of currentNodes) {
      if (node.parentNode === parent) {
        parent.removeChild(node);
      }
    }
    currentNodes = [];
  };

  effect(() => {
    const nextValue = reactiveChild.value;

    if (typeof nextValue === "string" || typeof nextValue === "number") {
      const textContent = String(nextValue);

      if (currentNodes.length === 1 && currentNodes[0] instanceof Text) {
        currentNodes[0].data = textContent;
        return;
      }

      cleanupCurrentNodes();
      const textNode = document.createTextNode(textContent);
      parent.insertBefore(textNode, anchor);
      currentNodes = [textNode];
      return;
    }

    if (
      typeof nextValue === "boolean" ||
      nextValue === null ||
      nextValue === undefined
    ) {
      cleanupCurrentNodes();
      return;
    }

    const nextNodes = createNodesFromValue(nextValue);
    cleanupCurrentNodes();

    for (const node of nextNodes) {
      parent.insertBefore(node, anchor);
    }

    currentNodes = nextNodes;
  });
};

/**
 * Append JSX children while handling arrays, reactive values, and primitives.
 */
const appendChild = (parent: Element, child: unknown) => {
  if (Array.isArray(child)) {
    child.forEach((item) => appendChild(parent, item));
    return;
  }

  if (typeof child === "boolean" || child === null || child === undefined) {
    return;
  }

  if (isReactiveNode(child)) {
    mountReactiveChild(parent, child);
    return;
  }

  if (typeof child === "string" || typeof child === "number") {
    parent.appendChild(document.createTextNode(String(child)));
    return;
  }

  if (isDomNode(child)) {
    parent.appendChild(child);
  }
};

export { appendChild };
