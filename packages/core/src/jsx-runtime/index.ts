/**
 * JSX Runtime for Dathomir
 *
 * Provides jsx(), jsxs(), and Fragment for JSX transformation.
 * This enables JSX syntax in components.
 */
import { templateEffect } from "@dathomir/reactivity";
import type { RuntimeJSX } from "@dathomir/runtime";
import {
  event,
  firstChild,
  fromTree,
  nextSibling,
  setText,
  type Tree,
} from "@dathomir/runtime";

export { Fragment } from "./Fragment";

type JSXChild =
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => unknown);
type JSXChildren = JSXChild | JSXChild[];

interface JSXProps {
  children?: JSXChildren;
  [key: string]: unknown;
}

/**
 * Check if a value is a reactive accessor (has .value property access).
 */
function isReactiveValue(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as Record<string, unknown>).value !== "undefined"
  );
}

/**
 * Check if a key is an event handler.
 */
function isEventHandler(key: string): boolean {
  return (
    key.startsWith("on") && key.length > 2 && key[2] === key[2].toUpperCase()
  );
}

/**
 * Get event type from handler key (onClick -> click).
 */
function getEventType(key: string): string {
  return key.slice(2).toLowerCase();
}

/**
 * Create a DOM element from JSX.
 */
function createElement(
  tag: string | ((props: JSXProps) => Node),
  props: JSXProps | null,
): Node {
  // Handle function components
  if (typeof tag === "function") {
    return tag(props || {});
  }

  const { children, ...attrs } = props || {};

  // Build tree structure
  const tree: Tree[] = [[tag, Object.keys(attrs).length > 0 ? {} : null]];
  const treeNode = tree[0] as [
    string,
    Record<string, unknown> | null,
    ...Tree[],
  ];

  // Separate static attrs from dynamic ones and events
  const staticAttrs: Record<string, unknown> = {};
  const dynamicAttrs: Array<{ key: string; value: unknown }> = [];
  const events: Array<{ type: string; handler: EventListener }> = [];

  for (const [key, value] of Object.entries(attrs)) {
    if (isEventHandler(key)) {
      events.push({ type: getEventType(key), handler: value as EventListener });
    } else if (isReactiveValue(value)) {
      dynamicAttrs.push({ key, value });
    } else {
      staticAttrs[key] = value;
    }
  }

  if (Object.keys(staticAttrs).length > 0) {
    treeNode[1] = staticAttrs;
  }

  // Process children
  const dynamicTexts: Array<{ index: number; getter: () => unknown }> = [];
  const childNodes: Node[] = [];

  function processChild(child: JSXChild, _index: number): void {
    if (child === null || child === undefined || typeof child === "boolean") {
      return;
    }

    if (typeof child === "string" || typeof child === "number") {
      treeNode.push(String(child));
    } else if (child instanceof Node) {
      // For DOM nodes, we'll append them after template creation
      treeNode.push(["{insert}", null]);
      childNodes.push(child);
    } else if (typeof child === "function") {
      // Getter function for reactive text: {() => count.value}
      treeNode.push(["{text}", null]);
      dynamicTexts.push({
        index: treeNode.length - 3,
        getter: child as () => unknown,
      });
    } else if (isReactiveValue(child)) {
      // Direct reactive value (signal/computed)
      treeNode.push(["{text}", null]);
      dynamicTexts.push({
        index: treeNode.length - 3,
        getter: () => (child as { value: unknown }).value,
      });
    }
  }

  if (Array.isArray(children)) {
    children.forEach((child, i) => processChild(child, i));
  } else if (children !== undefined) {
    processChild(children, 0);
  }

  // Create DOM
  const factory = fromTree(tree, 0);
  const fragment = factory();
  const element = firstChild(fragment) as HTMLElement;

  // Bind events
  for (const { type, handler } of events) {
    event(type, element, handler);
  }

  // Bind dynamic attributes
  for (const { key, value } of dynamicAttrs) {
    templateEffect(() => {
      const v = (value as { value: unknown }).value;
      if (key === "class" || key === "className") {
        element.setAttribute("class", String(v));
      } else {
        element.setAttribute(key, String(v));
      }
    });
  }

  // Bind dynamic text nodes
  if (dynamicTexts.length > 0) {
    let textNode = firstChild(element, true);
    let textIndex = 0;

    for (const { index, getter } of dynamicTexts) {
      // Navigate to the correct text node
      while (textIndex < index && textNode) {
        textNode = nextSibling(textNode);
        textIndex++;
      }

      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const tn = textNode as Text;
        templateEffect(() => {
          setText(tn, String(getter()));
        });
      }
    }
  }

  // Append child nodes
  for (const childNode of childNodes) {
    element.appendChild(childNode);
  }

  return element;
}

/**
 * JSX factory function for elements with single child.
 */
export function jsx(
  tag: string | ((props: JSXProps) => Node),
  props: JSXProps | null,
): Node {
  return createElement(tag, props);
}

/**
 * JSX factory function for elements with multiple children.
 */
export function jsxs(
  tag: string | ((props: JSXProps) => Node),
  props: JSXProps | null,
): Node {
  return createElement(tag, props);
}

/**
 * Development JSX factory (same as jsx in production).
 */
export const jsxDEV = jsx;

/**
 * JSX type definitions.
 * Enables TypeScript support for JSX elements.
 * Uses detailed HTML element types from @dathomir/runtime.
 * IntrinsicElements is an interface (not type) to allow module augmentation
 * via declaration merging for custom elements defined with defineComponent.
 */
export namespace JSX {
  export interface IntrinsicElements extends RuntimeJSX.IntrinsicElements {
    /** Custom elements (tag names with hyphens) - fallback for unregistered custom elements */
    [K: `${string}-${string}`]: Record<string, unknown>;
  }

  export interface Element extends Node {}

  export interface ElementAttributesProperty {
    props: Record<string, unknown>;
  }

  export interface ElementChildrenAttribute {
    children: unknown;
  }
}
