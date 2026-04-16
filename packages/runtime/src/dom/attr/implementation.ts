function stringifyAttrValue(value: unknown): string {
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

  if (JSON.stringify(value) === "{}") {
    return String(value);
  }

  return JSON.stringify(value) ?? "";
}

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
  } else if (name === "style" && typeof value === "object") {
    // Serialize style object to cssText
    const styleObj = value as Record<string, unknown>;
    const cssText = Object.entries(styleObj)
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => {
          // Convert camelCase to kebab-case
          const kebab = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
          return `${kebab}: ${stringifyAttrValue(v)}`;
        })
        .join("; ");
    if (cssText !== "") {
      element.setAttribute("style", cssText);
    } else {
      element.removeAttribute("style");
    }
  } else {
    element.setAttribute(name, stringifyAttrValue(value));
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
