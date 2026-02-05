import { Namespace, type Tree, type TreeNode } from "@/types/tree";

const SVG_NS = "http://www.w3.org/2000/svg";
const MATHML_NS = "http://www.w3.org/1998/Math/MathML";

/**
 * Cache for template factories to enable DOM cloning optimization.
 */
const templateCache = new WeakMap<readonly Tree[], () => DocumentFragment>();

/**
 * Check if a tree node is a placeholder.
 */
function isPlaceholder(node: Tree): node is [string, null] {
  return (
    Array.isArray(node) &&
    node.length === 2 &&
    node[1] === null &&
    typeof node[0] === "string" &&
    node[0].startsWith("{")
  );
}

/**
 * Check if a tree node is an element node.
 */
function isElement(node: Tree): node is TreeNode {
  return (
    Array.isArray(node) &&
    node.length >= 2 &&
    typeof node[0] === "string" &&
    !node[0].startsWith("{")
  );
}

/**
 * Create a DOM element from a tree structure.
 * @param tree The tree structure to convert.
 * @param ns The namespace (0 = HTML, 1 = SVG, 2 = MathML).
 * @returns The created DOM node.
 */
function createNode(tree: Tree, ns: Namespace): Node {
  // Text node
  if (typeof tree === "string") {
    return document.createTextNode(tree);
  }

  // Placeholder - create an empty text node as marker
  if (isPlaceholder(tree)) {
    return document.createTextNode("");
  }

  // Element node
  if (!isElement(tree)) {
    return document.createTextNode("");
  }

  const [tag, attrs, ...children] = tree;

  // Determine namespace
  let elementNs = ns;
  if (tag === "svg") {
    elementNs = Namespace.SVG;
  } else if (tag === "math") {
    elementNs = Namespace.MathML;
  }

  // Create element with appropriate namespace
  let element: Element;
  if (elementNs === Namespace.SVG) {
    element = document.createElementNS(SVG_NS, tag);
  } else if (elementNs === Namespace.MathML) {
    element = document.createElementNS(MATHML_NS, tag);
  } else {
    element = document.createElement(tag);
  }

  // Set attributes
  if (attrs !== null) {
    for (const key of Object.keys(attrs)) {
      const value = attrs[key];
      if (value !== undefined && value !== null && value !== false) {
        if (value === true) {
          element.setAttribute(key, "");
        } else {
          element.setAttribute(key, String(value));
        }
      }
    }
  }

  // Append children
  for (const child of children) {
    element.appendChild(createNode(child as Tree, elementNs));
  }

  return element;
}

/**
 * Build a document fragment from a tree structure.
 * @param structure The tree structure to convert (array of trees).
 * @param ns The namespace (0 = HTML, 1 = SVG, 2 = MathML).
 * @returns The created DocumentFragment.
 */
function buildFragment(
  structure: readonly Tree[],
  ns: Namespace,
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const tree of structure) {
    fragment.appendChild(createNode(tree, ns));
  }
  return fragment;
}

/**
 * Create a factory function that produces cloned DOM fragments from a tree structure.
 * Uses template caching to enable efficient cloning of repeated structures.
 *
 * @param structure The tree structure to convert.
 * @param flags Namespace flags (0 = HTML, 1 = SVG, 2 = MathML).
 * @returns A factory function that returns a cloned DocumentFragment.
 */
function fromTree(
  structure: readonly Tree[],
  flags: Namespace = Namespace.HTML,
): () => DocumentFragment {
  // Check cache first
  let factory = templateCache.get(structure);
  if (factory !== undefined) {
    return factory;
  }

  // Build template once
  const template = buildFragment(structure, flags);

  // Create and cache factory
  factory = () => template.cloneNode(true) as DocumentFragment;
  templateCache.set(structure, factory);

  return factory;
}

export { fromTree };
