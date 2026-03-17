/**
 * Get the first child of a node.
 * If isText is true, skips to find the first text node.
 *
 * Generated code guarantees a child always exists at the call site.
 * Uses non-null assertion to keep return type as Node and minimize bundle size.
 *
 * @param node The parent node.
 * @param isText Whether to look for a text node.
 * @returns The first child node.
 */
function firstChild(node: Node, isText?: boolean): Node {
  let child = node.firstChild;
  if (isText) {
    while (child !== null && child.nodeType !== Node.TEXT_NODE) {
      child = child.nextSibling;
    }
  }
  return child as Node;
}

/**
 * Get the next sibling of a node.
 *
 * Generated code guarantees a next sibling always exists at the call site.
 * Uses non-null assertion to keep return type as Node and minimize bundle size.
 *
 * @param node The current node.
 * @returns The next sibling node.
 */
function nextSibling(node: Node): Node {
  return node.nextSibling as Node;
}

export { firstChild, nextSibling };
