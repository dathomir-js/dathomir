import {
  nArrowBlock,
  nBlock,
  nCall,
  nConst,
  nExprStmt,
  nId,
  nLit,
  nMember,
  nObj,
  nProp,
  nReturn,
} from "@/transform/ast/implementation";
import type { ESTNode } from "@/transform/ast/implementation";
import { generateNavigation } from "@/transform/navigation/implementation";
import { createTemplateId } from "@/transform/state/implementation";
import type { TransformState } from "@/transform/state/implementation";
import { getTagName } from "@/transform/jsx/implementation";
import {
  containsReactiveAccess,
  jsxToTree,
} from "@/transform/tree/implementation";
import type { NestedTransformers } from "@/transform/tree/implementation";
import type { JSXElement, JSXFragment } from "@/transform/jsx/implementation";

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

function getLiteralValue(node: ESTNode): string | number | boolean | null | null {
  return node.type === "Literal"
    ? ((node.value as string | number | boolean | null | undefined) ?? null)
    : null;
}

function readStyleObject(node: ESTNode): Record<string, StaticStyleValue> | null {
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
        ? keyNode.name
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
        ? keyNode.name
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

  const [tagNode, attrsNode, ...childNodes] = node.elements as ESTNode[];
  if (
    tagNode?.type === "Literal" &&
    typeof tagNode.value === "string" &&
    attrsNode?.type === "Literal" &&
    attrsNode.value === null &&
    node.elements.length === 2 &&
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

  const attrs = readAttrs(attrsNode as ESTNode);
  if (attrsNode !== undefined && attrs === null && !(attrsNode.type === "Literal" && attrsNode.value === null)) {
    return null;
  }

  const children: StaticTreeNode[] = [];
  for (const childNode of childNodes) {
    if (childNode === null || childNode === undefined) {
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
  for (const element of tree.elements as ESTNode[]) {
    if (element === null || element === undefined) {
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

function serializeStyleObject(
  value: Record<string, StaticStyleValue>,
): string {
  const parts: string[] = [];
  for (const [key, entry] of Object.entries(value)) {
    if (entry == null || entry === "") {
      continue;
    }

    parts.push(`${camelToKebab(key)}: ${String(entry)}`);
  }

  return parts.join("; ");
}

function serializeAttrs(attrs: Record<string, StaticAttrValue> | null): string {
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

    parts.push(` ${key}="${escapeAttr(String(value))}"`);
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
    node.tag === "svg"
      ? "svg"
      : node.tag === "math"
        ? "math"
        : namespace;
  const openingTag = `<${node.tag}${serializeAttrs(node.attrs)}>`;
  const children = node.children
    .map((child) => serializeMarkupNode(child, nextNamespace, textPlaceholderId))
    .join("");

  if (namespace === "html" && HTML_VOID_ELEMENTS.has(node.tag.toLowerCase())) {
    return `<${node.tag}${serializeAttrs(node.attrs)} />`;
  }

  return `${openingTag}${children}</${node.tag}>`;
}

function getTemplateNamespace(
  node: JSXElement | JSXFragment,
  inheritedNamespace: "html" | "svg" | "math",
): Namespace {
  if (node.type === "JSXFragment") {
    return inheritedNamespace === "svg"
      ? 1
      : inheritedNamespace === "math"
        ? 2
        : 0;
  }

  const tagName = getTagName(node.openingElement.name);
  if (tagName === "svg") {
    return 1;
  }

  if (tagName === "math") {
    return 2;
  }

  return inheritedNamespace === "svg"
    ? 1
    : inheritedNamespace === "math"
      ? 2
      : 0;
}

function buildCompiledTemplateDescriptor(
  tree: ESTNode,
  namespace: Namespace,
): ESTNode | null {
  const roots = readStaticTreeRoots(tree);
  if (roots === null) {
    return null;
  }

  const textPlaceholderId = { current: 0 };
  const markup = roots
    .map((root) =>
      serializeMarkupNode(
        root,
        namespace === 1 ? "svg" : namespace === 2 ? "math" : "html",
        textPlaceholderId,
      ),
    )
    .join("");

  return nObj([
    nProp(nId("kind"), nLit("compiled")),
    nProp(nId("markup"), nLit(markup)),
    nProp(nId("namespace"), nLit(namespace)),
  ]);
}

/**
 * Transform a JSX element/fragment node to CSR DOM code.
 */
function transformJSXNode(
  node: JSXElement | JSXFragment,
  state: TransformState,
  nested: NestedTransformers,
): ESTNode {
  const inheritedNamespace = state.currentElementNamespace ?? "html";
  const { tree, dynamicParts } = jsxToTree(node, state, nested);

  const templateId = createTemplateId(state);
  state.runtimeImports.add("fromTree");

  const compiledTemplateDescriptor = buildCompiledTemplateDescriptor(
    tree,
    getTemplateNamespace(node, inheritedNamespace),
  );

  state.templates.push(
    nConst(
      templateId,
      nCall(nId("fromTree"), [compiledTemplateDescriptor ?? tree, nLit(0)]),
    ),
  );

  const setupStatements: ESTNode[] = [];
  const fragmentId = nId("_f");
  setupStatements.push(nConst(fragmentId, nCall(templateId, [])));

  const nodeDeclarations: ESTNode[] = [];
  const updateStatements: ESTNode[] = [];
  const declaredNodeIds = new Set<string>();

  function ensureNodeDeclaration(path: number[]): ESTNode {
    const nodeName = `_n${path.join("_")}`;
    const nodeId = nId(nodeName);

    if (!declaredNodeIds.has(nodeName)) {
      declaredNodeIds.add(nodeName);
      nodeDeclarations.push(
        nConst(nodeId, generateNavigation(fragmentId, path, state)),
      );
    }

    return nodeId;
  }

  for (const part of dynamicParts) {
    const nodeId = ensureNodeDeclaration(part.path);

    switch (part.type) {
      case "text": {
        state.runtimeImports.add("setText");
        state.runtimeImports.add("templateEffect");

        updateStatements.push(
          nExprStmt(
            nCall(nId("templateEffect"), [
              nArrowBlock(
                [],
                nBlock([
                  nExprStmt(nCall(nId("setText"), [nodeId, part.expression])),
                ]),
              ),
            ]),
          ),
        );
        break;
      }

      case "attr": {
        state.runtimeImports.add("setAttr");

        const attrUpdate = nExprStmt(
          nCall(nId("setAttr"), [
            nodeId,
            nLit(part.key),
            part.expression,
          ]),
        );

        if (containsReactiveAccess(part.expression)) {
          state.runtimeImports.add("templateEffect");
          updateStatements.push(
            nExprStmt(
              nCall(nId("templateEffect"), [
                nArrowBlock([], nBlock([attrUpdate])),
              ]),
            ),
          );
        } else {
          updateStatements.push(attrUpdate);
        }
        break;
      }

      case "event": {
        state.runtimeImports.add("event");

        updateStatements.push(
          nExprStmt(
            nCall(nId("event"), [
              nLit(part.key),
              nodeId,
              part.expression,
            ]),
          ),
        );
        break;
      }

      case "insert": {
        state.runtimeImports.add("insert");

        if (part.isComponent) {
          updateStatements.push(
            nExprStmt(
              nCall(nId("insert"), [
                nMember(nodeId, nId("parentNode")),
                part.expression,
                nodeId,
              ]),
            ),
          );
        } else {
          state.runtimeImports.add("templateEffect");
          updateStatements.push(
            nExprStmt(
              nCall(nId("templateEffect"), [
                nArrowBlock(
                  [],
                  nBlock([
                    nExprStmt(
                      nCall(nId("insert"), [
                        nMember(nodeId, nId("parentNode")),
                        part.expression,
                        nodeId,
                      ]),
                    ),
                  ]),
                ),
              ]),
            ),
          );
        }
        break;
      }

      case "spread": {
        state.runtimeImports.add("spread");
        state.runtimeImports.add("templateEffect");

        updateStatements.push(
          nExprStmt(
            nCall(nId("templateEffect"), [
              nArrowBlock(
                [],
                nBlock([
                  nExprStmt(nCall(nId("spread"), [nodeId, part.expression])),
                ]),
              ),
            ]),
          ),
        );
        break;
      }
    }
  }

  setupStatements.push(...nodeDeclarations);
  setupStatements.push(...updateStatements);
  setupStatements.push(nReturn(fragmentId));
  return nCall(nArrowBlock([], nBlock(setupStatements)), []);
}

export { transformJSXNode };
