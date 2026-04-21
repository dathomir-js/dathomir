import type { ESTNode } from "@/transform/ast/implementation";

const HTML_VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

type StaticStyleValue = string | number | boolean | null;

type StaticAttrValue =
  | string
  | number
  | boolean
  | null
  | Record<string, StaticStyleValue>;

type StaticTreeNode =
  | string
  | { kind: "text" | "insert" | "each" }
  | {
      tag: string;
      attrs: Record<string, StaticAttrValue> | null;
      children: StaticTreeNode[];
    };

function getLiteralValue(node: ESTNode): string | number | boolean | null {
  return node.type === "Literal"
    ? ((node.value as string | number | boolean | null | undefined) ?? null)
    : null;
}

function stringifyStaticAttrValue(value: StaticAttrValue): string {
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function readStyleObject(
  node: ESTNode,
): Record<string, StaticStyleValue> | null {
  if (node.type !== "ObjectExpression") {
    return null;
  }

  const style: Record<string, StaticStyleValue> = {};
  for (const property of node.properties as ESTNode[]) {
    if (property.type !== "Property") {
      return null;
    }

    const keyNode = property.key as ESTNode;
    const valueNode = property.value as ESTNode;
    const key =
      keyNode.type === "Identifier"
        ? (keyNode.name as string)
        : typeof keyNode.value === "string"
          ? keyNode.value
          : null;
    if (key === null) {
      return null;
    }

    if (valueNode.type !== "Literal") {
      return null;
    }

    style[key] = (valueNode.value as StaticStyleValue | undefined) ?? null;
  }

  return style;
}

function readAttrs(node: ESTNode): Record<string, StaticAttrValue> | null {
  if (node.type === "Literal" && node.value === null) {
    return null;
  }

  if (node.type !== "ObjectExpression") {
    return null;
  }

  const attrs: Record<string, StaticAttrValue> = {};
  for (const property of node.properties as ESTNode[]) {
    if (property.type !== "Property") {
      return null;
    }

    const keyNode = property.key as ESTNode;
    const valueNode = property.value as ESTNode;
    const key =
      keyNode.type === "Identifier"
        ? (keyNode.name as string)
        : typeof keyNode.value === "string"
          ? keyNode.value
          : null;
    if (key === null) {
      return null;
    }

    const literalValue = getLiteralValue(valueNode);
    if (valueNode.type === "Literal") {
      attrs[key] = literalValue;
      continue;
    }

    const styleObject = readStyleObject(valueNode);
    if (styleObject === null) {
      return null;
    }

    attrs[key] = styleObject;
  }

  return attrs;
}

function readStaticTreeNode(node: ESTNode): StaticTreeNode | null {
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }

  if (node.type !== "ArrayExpression") {
    return null;
  }

  const elements = node.elements as Array<ESTNode | null | undefined>;
  const [tagNode, attrsNode, ...childNodes] = elements;
  if (
    tagNode?.type === "Literal" &&
    typeof tagNode.value === "string" &&
    attrsNode?.type === "Literal" &&
    attrsNode.value === null &&
    elements.length === 2 &&
    tagNode.value.startsWith("{")
  ) {
    if (tagNode.value === "{text}") {
      return { kind: "text" };
    }

    if (tagNode.value === "{insert}") {
      return { kind: "insert" };
    }

    if (tagNode.value === "{each}") {
      return { kind: "each" };
    }

    return null;
  }

  if (!(tagNode?.type === "Literal" && typeof tagNode.value === "string")) {
    return null;
  }

  const attrs = attrsNode == null ? null : readAttrs(attrsNode);
  if (
    attrsNode != null &&
    attrs === null &&
    !(attrsNode.type === "Literal" && attrsNode.value === null)
  ) {
    return null;
  }

  const children: StaticTreeNode[] = [];
  for (const childNode of childNodes) {
    if (childNode == null) {
      return null;
    }

    const child = readStaticTreeNode(childNode);
    if (child === null) {
      return null;
    }

    children.push(child);
  }

  return {
    tag: tagNode.value,
    attrs,
    children,
  };
}

function readStaticTreeRoots(tree: ESTNode): StaticTreeNode[] | null {
  if (tree.type !== "ArrayExpression") {
    return null;
  }

  const roots: StaticTreeNode[] = [];
  for (const element of tree.elements as Array<ESTNode | null | undefined>) {
    if (element == null) {
      return null;
    }

    const root = readStaticTreeNode(element);
    if (root === null) {
      return null;
    }

    roots.push(root);
  }

  return roots;
}

function hasCustomElement(node: StaticTreeNode): boolean {
  if (typeof node === "string" || "kind" in node) {
    return false;
  }

  if (node.tag.includes("-")) {
    return true;
  }

  return node.children.some(hasCustomElement);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function camelToKebab(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function serializeStyleObject(value: Record<string, StaticStyleValue>): string {
  const parts: string[] = [];
  for (const [key, entry] of Object.entries(value)) {
    if (entry == null || entry === "") {
      continue;
    }

    parts.push(`${camelToKebab(key)}: ${String(entry)}`);
  }

  return parts.join("; ");
}

function serializeStaticAttrs(
  attrs: Record<string, StaticAttrValue> | null,
): string {
  if (attrs === null) {
    return "";
  }

  const parts: string[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === false) {
      continue;
    }

    if (value === true) {
      parts.push(` ${key}`);
      continue;
    }

    if (key === "style" && typeof value === "object") {
      const cssText = serializeStyleObject(value);
      if (cssText !== "") {
        parts.push(` style="${escapeAttr(cssText)}"`);
      }
      continue;
    }

    parts.push(` ${key}="${escapeAttr(stringifyStaticAttrValue(value))}"`);
  }

  return parts.join("");
}

function serializeMarkupNode(
  node: StaticTreeNode,
  namespace: "html" | "svg" | "math",
  textPlaceholderId: { current: number },
): string {
  if (typeof node === "string") {
    return escapeHtml(node);
  }

  if ("kind" in node) {
    if (node.kind === "text") {
      const markerId = textPlaceholderId.current;
      textPlaceholderId.current += 1;
      return `<!--dh-csr:text:${markerId}-->`;
    }

    return `<!--${node.kind === "insert" ? "{insert}" : "{each}"}-->`;
  }

  const nextNamespace =
    node.tag === "svg" ? "svg" : node.tag === "math" ? "math" : namespace;
  const openingTag = `<${node.tag}${serializeStaticAttrs(node.attrs)}>`;
  const children = node.children
    .map((child) => serializeMarkupNode(child, nextNamespace, textPlaceholderId))
    .join("");

  if (namespace === "html" && HTML_VOID_ELEMENTS.has(node.tag.toLowerCase())) {
    return `<${node.tag}${serializeStaticAttrs(node.attrs)} />`;
  }

  return `${openingTag}${children}</${node.tag}>`;
}

export {
  hasCustomElement,
  readStaticTreeRoots,
  serializeMarkupNode,
  serializeStaticAttrs,
};
export type { StaticAttrValue, StaticStyleValue, StaticTreeNode };
