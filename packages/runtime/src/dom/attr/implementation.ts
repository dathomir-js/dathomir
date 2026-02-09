/**
 * Set an attribute on an element.
 * Handles boolean attributes and null/undefined removal.
 *
 * @param element The element to modify.
 * @param name The attribute name.
 * @param value The attribute value.
 */
function setAttr(element: Element, name: string, value: unknown): void {
  if (value === null || value === undefined || value === false) {
    element.removeAttribute(name);
  } else if (value === true) {
    element.setAttribute(name, "");
  } else {
    element.setAttribute(name, String(value));
  }
}

/**
 * Set a property on an element.
 * Used for DOM properties that cannot be set via attributes.
 *
 * @param element The element to modify.
 * @param name The property name.
 * @param value The property value.
 */
function setProp(element: Element, name: string, value: unknown): void {
  (element as unknown as Record<string, unknown>)[name] = value;
}

export { setAttr, setProp };
