import { normalizeStyle } from "@/utils";

/**
 * Apply a non-reactive property to a host element.
 * Handles special cases: ref, class/className, style, data-*, aria-*, and generic attributes.
 */
const applyProperty = (el: Element, key: string, value: unknown) => {
  if (key === "ref") {
    if (typeof value === "function") {
      value(el);
    } else if (value && typeof value === "object" && "current" in value) {
      (value as { current: Element | null }).current = el;
    }
    return;
  }
  if (key === "class" || key === "className") {
    if (value === false || value === null || value === undefined) {
      el.removeAttribute("class");
    } else {
      el.setAttribute("class", String(value));
    }
    return;
  }
  if (key === "style") {
    const style = normalizeStyle(value);
    if (style) {
      el.setAttribute("style", style);
    } else {
      el.removeAttribute("style");
    }
    return;
  }
  if (key.startsWith("data-") || key.startsWith("aria-")) {
    if (value === false || value === null || value === undefined) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, String(value));
    }
    return;
  }
  const host = el as HTMLElement & Record<string, unknown>;
  if (key in host) {
    host[key] = value as any;
    return;
  }
  if (value === true) {
    el.setAttribute(key, "");
    return;
  }
  if (value === false || value === null || value === undefined) {
    el.removeAttribute(key);
    return;
  }
  el.setAttribute(key, String(value));
};

export { applyProperty };
