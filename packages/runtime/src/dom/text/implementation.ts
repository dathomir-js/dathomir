function stringifyTextValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (typeof value === "symbol") {
    return value.description ?? "";
  }

  if (typeof value === "function") {
    return value.toString();
  }

  if (
    Object.prototype.hasOwnProperty.call(value, "toString") &&
    typeof (value as { toString?: unknown }).toString === "function"
  ) {
    return (value as { toString: () => string }).toString();
  }

  if (JSON.stringify(value) === "{}") {
    return "[object Object]";
  }

  return JSON.stringify(value);
}

/**
 * Set the text content of a text node.
 * Handles null, undefined, and non-string values safely.
 *
 * @param node The text node to update.
 * @param value The new text value (will be converted to string).
 */
function setText(node: Text, value: unknown): void {
  node.data = stringifyTextValue(value);
}

export { setText };
