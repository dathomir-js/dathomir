/**
 * Append a child node to a parent.
 *
 * @param parent The parent node.
 * @param child The child node to append.
 */
function append(parent: Node, child: Node): void {
  parent.appendChild(child);
}

/**
 * Track inserted content for each marker (anchor) to enable cleanup.
 * WeakMap ensures no memory leaks when markers are removed.
 */
const insertedContent = new WeakMap<Node, Node[]>();

/**
 * Insert a child node before an anchor node.
 * If anchor is null, appends to the end.
 *
 * For dynamic inserts (called within templateEffect), this function:
 * 1. On first call (Hydration): removes SSR content after the anchor
 * 2. On subsequent calls: removes previously inserted content
 * 3. Inserts the new content
 * 4. Tracks the newly inserted nodes for future cleanup
 *
 * @param parent The parent node.
 * @param child The child node to insert.
 * @param anchor The anchor node (marker for insert position).
 */
function insert(
  parent: Node,
  child: Node | (() => DocumentFragment) | unknown,
  anchor: Node | null,
): void {
  // Warn on null/undefined parent and bail out early to avoid crash
  if (parent == null) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn(
        `[insert] parent is ${parent === null ? "null" : "undefined"}. ` +
          `Cannot insert child into a non-existent parent node.`,
      );
    }
    return;
  }

  // Clean up previously inserted content OR SSR content
  if (anchor) {
    if (insertedContent.has(anchor)) {
      // Remove previously inserted dynamic content
      const previousNodes = insertedContent.get(anchor)!;
      for (const node of previousNodes) {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
      insertedContent.delete(anchor);
    } else {
      // First call after SSR: remove SSR content after the marker
      // SSR renders: <!--marker-->content, so we need to remove content
      let ssrNode = anchor.nextSibling;
      const ssrNodesToRemove: Node[] = [];

      // Collect SSR nodes until we hit another marker or end
      while (ssrNode) {
        // Stop if we hit another hydration marker (comment starting with "dh:")
        if (
          ssrNode.nodeType === Node.COMMENT_NODE &&
          ssrNode.nodeValue?.startsWith("dh:")
        ) {
          break;
        }

        const nextNode = ssrNode.nextSibling;
        ssrNodesToRemove.push(ssrNode);
        ssrNode = nextNode;
      }

      // Remove collected SSR nodes
      for (const node of ssrNodesToRemove) {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
    }
  }

  // Track new nodes for future cleanup
  const newNodes: Node[] = [];

  // Handle different types of child nodes
  if (child instanceof DocumentFragment) {
    // DocumentFragment: collect all children before insertion
    const children = Array.from(child.childNodes);
    newNodes.push(...children);
    parent.insertBefore(child, anchor);
  } else if (child instanceof Node) {
    // Regular node
    newNodes.push(child);
    parent.insertBefore(child, anchor);
  } else if (typeof child === "function") {
    // Factory function that returns a fragment
    const fragment = (child as () => DocumentFragment)();
    const children = Array.from(fragment.childNodes);
    newNodes.push(...children);
    parent.insertBefore(fragment, anchor);
  } else {
    // Unexpected type - log error in development
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.error("[insert] Unexpected child type:", typeof child, child);
    }
    // Try to convert to text node as fallback
    const textNode = document.createTextNode(String(child));
    newNodes.push(textNode);
    parent.insertBefore(textNode, anchor);
  }

  // Track inserted nodes for this anchor (marker)
  if (anchor && newNodes.length > 0) {
    insertedContent.set(anchor, newNodes);
  }
}

export { append, insert };
