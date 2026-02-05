/**
 * Keyed list reconciliation for efficient DOM updates.
 * Uses a simple but effective algorithm to minimize DOM operations.
 */

interface ManagedItem<T> {
  key: unknown;
  node: Node;
  item: T;
}

/**
 * WeakMap to store managed items for each parent node.
 */
const managedLists = new WeakMap<Node, ManagedItem<unknown>[]>();

/**
 * Reconcile a list of items with the DOM, efficiently updating, adding, and removing nodes.
 *
 * @param parent The parent node containing the list.
 * @param items The current array of items.
 * @param keyFn Function to extract a unique key from each item.
 * @param createFn Function to create a DOM node for an item.
 */
function reconcile<T>(
  parent: Node,
  items: T[],
  keyFn: (item: T) => unknown,
  createFn: (item: T) => Node,
): void {
  // Get or initialize managed items for this parent
  let managed = managedLists.get(parent) as ManagedItem<T>[] | undefined;
  if (managed === undefined) {
    managed = [];
    managedLists.set(parent, managed as ManagedItem<unknown>[]);
  }

  // Build a map of existing items by key
  const existingByKey = new Map<unknown, ManagedItem<T>>();
  for (const item of managed) {
    existingByKey.set(item.key, item);
  }

  // Track which keys are still in use
  const newKeys = new Set<unknown>();
  const newManaged: ManagedItem<T>[] = [];

  // Process new items in order
  let lastNode: Node | null = null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const key = keyFn(item);
    newKeys.add(key);

    let entry = existingByKey.get(key);

    if (entry === undefined) {
      // Create new node
      const node = createFn(item);
      entry = { key, node, item };

      // Insert at correct position
      if (lastNode === null) {
        // Insert at the beginning
        if (parent.firstChild !== null) {
          parent.insertBefore(node, parent.firstChild);
        } else {
          parent.appendChild(node);
        }
      } else {
        // Insert after lastNode
        const nextSibling = lastNode.nextSibling;
        if (nextSibling !== null) {
          parent.insertBefore(node, nextSibling);
        } else {
          parent.appendChild(node);
        }
      }
    } else {
      // Reuse existing node
      entry.item = item;

      // Move to correct position if needed
      if (lastNode === null) {
        // Should be the first child
        if (entry.node !== parent.firstChild) {
          parent.insertBefore(entry.node, parent.firstChild);
        }
      } else if (entry.node.previousSibling !== lastNode) {
        // Not in the right position, move it
        const nextSibling = lastNode.nextSibling;
        if (nextSibling !== null) {
          parent.insertBefore(entry.node, nextSibling);
        } else {
          parent.appendChild(entry.node);
        }
      }
    }

    newManaged.push(entry);
    lastNode = entry.node;
  }

  // Remove nodes that are no longer present
  for (const entry of managed) {
    if (!newKeys.has(entry.key)) {
      parent.removeChild(entry.node);
    }
  }

  // Update managed list
  managedLists.set(parent, newManaged as ManagedItem<unknown>[]);
}

export { reconcile };
