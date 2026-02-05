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
 * Insert a child node before an anchor node.
 * If anchor is null, appends to the end.
 *
 * @param parent The parent node.
 * @param child The child node to insert.
 * @param anchor The anchor node (or null to append).
 */
function insert(parent: Node, child: Node, anchor: Node | null): void {
  parent.insertBefore(child, anchor);
}

export { append, insert };
