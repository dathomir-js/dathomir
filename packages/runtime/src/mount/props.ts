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
    if (value === false || value === null || value === undefined) {
      el.removeAttribute("style");
      return;
    }
    if (typeof value === "string") {
      el.setAttribute("style", value);
      return;
    }
    if (typeof value === "object" && value) {
      const styleObj = value as Record<string, unknown>;
      const toKebab = (s: string) =>
        s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      for (const k in styleObj) {
        const v = styleObj[k];
        const prop = toKebab(k);
        if (v === null || v === undefined || v === false) {
          (el as HTMLElement).style.removeProperty(prop);
        } else {
          (el as HTMLElement).style.setProperty(prop, String(v));
        }
      }
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
