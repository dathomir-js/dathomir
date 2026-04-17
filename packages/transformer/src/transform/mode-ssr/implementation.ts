import {
  nArr,
  nCall,
  nId,
  nLit,
  nMember,
  nNew,
  nObj,
  type ESTNode,
} from "@/transform/ast/implementation";
import type { JSXElement, JSXFragment } from "@/transform/jsx/implementation";
import type { TransformState } from "@/transform/state/implementation";
import {
  jsxToTree,
  type NestedTransformers,
} from "@/transform/tree/implementation";

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
    if (key === null || valueNode.type !== "Literal") {
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

  const attrs = readAttrs(attrsNode);
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

function mergeStaticPart(parts: ESTNode[], value: string): void {
  if (value === "") {
    return;
  }

  const previous = parts.at(-1);
  if (
    previous?.type === "Literal" &&
    typeof previous.value === "string" &&
    typeof previous.raw === "string"
  ) {
    previous.value += value;
    previous.raw = JSON.stringify(previous.value);
    return;
  }

  parts.push(nLit(value));
}

function buildJoinedExpression(parts: ESTNode[]): ESTNode {
  if (parts.length === 0) {
    return nLit("");
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return nCall(nMember(nArr(parts), nId("join")), [nLit("")]);
}

function buildLegacyRenderCall(
  tree: ESTNode,
  dynamicParts: Array<{ type: string; expression: ESTNode }>,
  state: TransformState,
): ESTNode {
  state.runtimeImports.add("renderToString");

  const markerDynamicParts = dynamicParts.filter(
    (part) => part.type === "text" || part.type === "insert",
  );
  const nonMarkerDynamicParts = dynamicParts.filter(
    (part) => part.type === "attr" || part.type === "spread",
  );

  const dynamicValueEntries: ESTNode[] = [];
  let dynamicId = 1;

  for (const part of markerDynamicParts) {
    dynamicValueEntries.push(nArr([nLit(dynamicId), part.expression]));
    dynamicId += 1;
  }

  for (const part of nonMarkerDynamicParts) {
    dynamicValueEntries.push(nArr([nLit(dynamicId), part.expression]));
    dynamicId += 1;
  }

  const dynamicValuesMap = nNew(nId("Map"), [nArr(dynamicValueEntries)]);
  return nCall(nId("renderToString"), [tree, nObj([]), dynamicValuesMap]);
}

/**
 * Transform a JSX element/fragment node to SSR render code.
 */
function transformJSXForSSRNode(
  node: JSXElement | JSXFragment,
  state: TransformState,
  nested: NestedTransformers,
): ESTNode {
  const inheritedNamespace = state.currentElementNamespace ?? "html";
  const { tree, dynamicParts } = jsxToTree(node, state, nested);
  const roots = readStaticTreeRoots(tree);
  if (roots === null || roots.some(hasCustomElement)) {
    return buildLegacyRenderCall(tree, dynamicParts, state);
  }

  const markerDynamicParts = dynamicParts.filter(
    (part) => part.type === "text" || part.type === "insert",
  );
  let markerIndex = 0;
  let markerId = 1;
  const parts: ESTNode[] = [];

  function serializeNode(
    currentNode: StaticTreeNode,
    path: number[],
    namespace: "html" | "svg" | "math",
  ): void {
    if (typeof currentNode === "string") {
      mergeStaticPart(parts, escapeHtml(currentNode));
      return;
    }

    if ("kind" in currentNode) {
      const currentMarkerId = markerId;
      markerId += 1;
      const binding = markerDynamicParts[markerIndex];
      markerIndex += 1;

      if (currentNode.kind === "text") {
        if (binding.type !== "text") {
          return;
        }

        state.runtimeImports.add("renderDynamicText");
        mergeStaticPart(parts, `<!--dh:t:${currentMarkerId}-->`);
        parts.push(nCall(nId("renderDynamicText"), [binding.expression]));
        return;
      }

      if (binding.type !== "insert") {
        return;
      }

      if (currentNode.kind === "each") {
        state.runtimeImports.add("renderDynamicEach");
        mergeStaticPart(parts, `<!--dh:b:${currentMarkerId}-->`);
        parts.push(nCall(nId("renderDynamicEach"), [binding.expression]));
        mergeStaticPart(parts, "<!--/dh:b-->");
        return;
      }

      state.runtimeImports.add("renderDynamicInsert");
      mergeStaticPart(parts, `<!--dh:i:${currentMarkerId}-->`);
      parts.push(nCall(nId("renderDynamicInsert"), [binding.expression]));
      mergeStaticPart(parts, "<!--/dh:i-->");
      return;
    }

    const nextNamespace =
      currentNode.tag === "svg"
        ? "svg"
        : currentNode.tag === "math"
          ? "math"
          : namespace;

    mergeStaticPart(
      parts,
      `<${currentNode.tag}${serializeStaticAttrs(currentNode.attrs)}`,
    );

    for (const dynamicPart of dynamicParts) {
      if (dynamicPart.path.join(".") !== path.join(".")) {
        continue;
      }

      if (dynamicPart.type === "attr") {
        state.runtimeImports.add("renderDynamicAttr");
        parts.push(
          nCall(nId("renderDynamicAttr"), [
            nLit(dynamicPart.key),
            dynamicPart.expression,
          ]),
        );
      }

      if (dynamicPart.type === "spread") {
        state.runtimeImports.add("renderDynamicSpread");
        parts.push(nCall(nId("renderDynamicSpread"), [dynamicPart.expression]));
      }
    }

    if (
      namespace === "html" &&
      HTML_VOID_ELEMENTS.has(currentNode.tag.toLowerCase())
    ) {
      mergeStaticPart(parts, " />");
      return;
    }

    mergeStaticPart(parts, ">");
    currentNode.children.forEach((child, index) => {
      serializeNode(child, [...path, index], nextNamespace);
    });
    mergeStaticPart(parts, `</${currentNode.tag}>`);
  }

  roots.forEach((root, index) => {
    serializeNode(root, [index], inheritedNamespace);
  });

  return buildJoinedExpression(parts);
}

export { transformJSXForSSRNode };
