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
  const placeholder = document.createRange();
  const childCount = parent.childNodes.length;
  placeholder.setStart(parent, childCount);
  placeholder.setEnd(parent, childCount);

  let currentNodes: Node[] = [];

  const collapsePlaceholder = () => {
    placeholder.collapse(true);
  };

  const cleanupCurrentNodes = () => {
    if (currentNodes.length === 0) {
      collapsePlaceholder();
      return;
    }

    const firstNode = currentNodes[0];
    const lastNode = currentNodes[currentNodes.length - 1];

    if (firstNode.parentNode !== parent || lastNode.parentNode !== parent) {
      currentNodes = [];
      collapsePlaceholder();
      return;
    }

    placeholder.setStartBefore(firstNode);
    placeholder.setEndAfter(lastNode);
    placeholder.deleteContents();
    collapsePlaceholder();
    currentNodes = [];
  };

  const insertNodes = (nodes: Node[]) => {
    if (nodes.length === 0) {
      currentNodes = [];
      collapsePlaceholder();
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const node of nodes) {
      fragment.appendChild(node);
    }

    placeholder.insertNode(fragment);
    placeholder.setStartBefore(nodes[0]);
    placeholder.setEndAfter(nodes[nodes.length - 1]);
    currentNodes = nodes;
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
      insertNodes([textNode]);
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

    insertNodes(nextNodes);
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
