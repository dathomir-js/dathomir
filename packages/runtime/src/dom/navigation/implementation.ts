/**
 * Get the first child of a node.
 * If isText is true, skips to find the first text node.
 *
 * @param node The parent node.
 * @param isText Whether to look for a text node.
 * @returns The first child node, or null if not found.
 */
function firstChild(node: Node, isText?: boolean): Node | null {
  let child = node.firstChild;
  if (isText) {
    while (child !== null && child.nodeType !== Node.TEXT_NODE) {
      child = child.nextSibling;
    }
  }
  return child;
}

/**
 * Get the next sibling of a node.
 *
 * @param node The current node.
 * @returns The next sibling node, or null if not found.
 */
function nextSibling(node: Node): Node | null {
  return node.nextSibling;
}

export { firstChild, nextSibling };
