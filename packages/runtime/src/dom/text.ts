/**
 * Set the text content of a text node.
 * Handles null, undefined, and non-string values safely.
 *
 * @param node The text node to update.
 * @param value The new text value (will be converted to string).
 */
function setText(node: Text, value: unknown): void {
  node.data = value == null ? "" : String(value);
}

export { setText };
