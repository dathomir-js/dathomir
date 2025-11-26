import { kebabCase } from "@dathomir/shared";

export const normalizeStyle = (value: unknown): string | null => {
  if (value === false || value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object" && value) {
    const styleObj = value as Record<string, unknown>;
    return Object.keys(styleObj)
      .map((key) => {
        const v = styleObj[key];
        if (v === null || v === undefined || v === false) {
          return "";
        }
        const prop = kebabCase(key);
        return `${prop}:${String(v)}`;
      })
      .filter(Boolean)
      .join(";");
  }
  return null;
};

export const eventNameFromProp = (propKey: string): string | null => {
  if (!propKey.startsWith("on") || propKey.length < 3) return null;
  const name = propKey.slice(2);
  const firstLower = name[0].toLowerCase() + name.slice(1);
  return firstLower.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
};
