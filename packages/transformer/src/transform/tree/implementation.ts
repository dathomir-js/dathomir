import { walk } from "zimmerframe";

import {
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isStringLiteral,
  nArr,
  nId,
  nLit,
  nObj,
  nProp,
  nSpread,
} from "@/transform/ast/implementation";
import type { CallExpression, ESTNode } from "@/transform/ast/implementation";
import {
  getColocatedClientDirective,
  getIslandsDirectiveName,
  getTagName,
  isClientDirectiveNamespace,
  isComponentTag,
  isValidIdentifier,
  jsxNameToExpression,
  normalizeIslandsDirectiveValue,
} from "@/transform/jsx/implementation";
import type {
  IslandsDirectiveName,
  JSXAttribute,
  JSXChild,
  JSXElement,
  JSXEmptyExpression,
  JSXExpressionContainer,
  JSXFragment,
  JSXSpreadAttribute,
  JSXSpreadChild,
} from "@/transform/jsx/implementation";
import type { TransformState } from "@/transform/state/implementation";
import { createClientTargetId } from "@/transform/state/implementation";

interface DynamicPart {
  type: "text" | "attr" | "event" | "spread" | "insert";
  isComponent?: boolean;
  path: number[];
  expression: ESTNode;
  key?: string;
}

interface TreeResult {
  tree: ESTNode;
  dynamicParts: DynamicPart[];
}

interface ProcessedAttributes {
  attrs: ESTNode;
  events: { type: string; handler: ESTNode }[];
  spreads: ESTNode[];
}

interface ColocatedClientState {
  strategy: "load" | "interaction" | null;
}

interface IslandsDirectiveMetadata {
  strategy: IslandsDirectiveName;
  value: ESTNode | null;
}

const RESERVED_ISLAND_METADATA_KEYS = new Set([
  "data-dh-island",
  "data-dh-island-value",
]);

function throwUnknownClientDirective(name: JSXAttribute["name"]): never {
  if (name.type !== "JSXNamespacedName") {
    throw new Error("[dathomir] Unknown client:* directive");
  }

  throw new Error(
    `[dathomir] Unknown client:* directive: client:${name.name.name}`,
  );
}

function getRawAttributeNameForDiagnostics(
  name: JSXAttribute["name"],
): string | null {
  if (name.type === "JSXIdentifier") {
    return name.name;
  }

  if (name.type === "JSXNamespacedName") {
    return `${name.namespace.name}:${name.name.name}`;
  }

  return null;
}

function getUnsupportedColocatedDirectiveError(
  name: JSXAttribute["name"],
): string | null {
  const rawName = getRawAttributeNameForDiagnostics(name);
  if (rawName === null) {
    return null;
  }

  if (rawName.startsWith("load:") || rawName.startsWith("interaction:")) {
    return `Unsupported colocated client directive: ${rawName}`;
  }

  return null;
}

interface NestedTransformers {
  transformJSXNode: (
    node: JSXElement | JSXFragment,
    state: TransformState,
    nested: NestedTransformers,
  ) => ESTNode;
  transformJSXForSSRNode: (
    node: JSXElement | JSXFragment,
    state: TransformState,
    nested: NestedTransformers,
  ) => ESTNode;
}

/**
 * Check if a node contains reactive access (.value).
 */
function containsReactiveAccess(node: ESTNode): boolean {
  if (
    isMemberExpression(node) &&
    isIdentifier(node.property) &&
    node.property.name === "value"
  ) {
    return true;
  }

  let found = false;
  walk(node, null, {
    MemberExpression(n: ESTNode, { next }: { next: () => void }) {
      if (
        isMemberExpression(n) &&
        isIdentifier(n.property) &&
        n.property.name === "value"
      ) {
        found = true;
      }
      if (!found) next();
    },
  });
  return found;
}

/**
 * Build a component function call expression from a JSX element.
 */
function buildComponentCall(
  node: JSXElement,
  state: TransformState,
  nested: NestedTransformers,
): ESTNode {
  const opening = node.openingElement;
  const componentRef = jsxNameToExpression(opening.name);

  const propsProperties: ESTNode[] = [];
  let islandsDirective: IslandsDirectiveMetadata | null = null;
  let hasExplicitReservedIslandMetadata = false;

  for (const attr of opening.attributes) {
    if (attr.type === "JSXSpreadAttribute") {
      propsProperties.push(nSpread(attr.argument));
      continue;
    }

    const directiveName = getIslandsDirectiveName(attr.name);
    if (directiveName !== null) {
      if (islandsDirective !== null) {
        throw new Error(
          `[dathomir] Multiple client:* directives are not allowed on a single component: <${getTagName(opening.name)}>`,
        );
      }

      islandsDirective = {
        strategy: directiveName,
        value: normalizeIslandsDirectiveValue(directiveName, attr.value),
      };
      continue;
    }

    const unsupportedColocatedDirectiveError =
      getUnsupportedColocatedDirectiveError(attr.name);
    if (unsupportedColocatedDirectiveError !== null) {
      throw new Error(`[dathomir] ${unsupportedColocatedDirectiveError}`);
    }

    if (isClientDirectiveNamespace(attr.name)) {
      throwUnknownClientDirective(attr.name);
    }

    const key = getAttributeName(attr.name);
    if (key === null) continue;

    if (RESERVED_ISLAND_METADATA_KEYS.has(key)) {
      hasExplicitReservedIslandMetadata = true;
    }

    const keyNode = isValidIdentifier(key) ? nId(key) : nLit(key);
    const computed = !isValidIdentifier(key);
    let value: ESTNode;

    if (attr.value === null) {
      value = nLit(true);
    } else if (isStringLiteral(attr.value)) {
      value = attr.value;
    } else if (isJSXExpressionContainer(attr.value)) {
      if (isJSXEmptyExpression(attr.value.expression)) continue;
      value = containsJSXNode(attr.value.expression)
        ? transformNestedJSX(attr.value.expression, state, nested)
        : attr.value.expression;
    } else {
      continue;
    }

    propsProperties.push(nProp(keyNode, value, computed));
  }

  if (islandsDirective !== null) {
    if (hasExplicitReservedIslandMetadata) {
      throw new Error(
        `[dathomir] client:* directives cannot be combined with explicit data-dh-island metadata on <${getTagName(opening.name)}>`,
      );
    }

    propsProperties.push(
      nProp(nLit("data-dh-island"), nLit(islandsDirective.strategy)),
    );

    if (islandsDirective.value !== null) {
      propsProperties.push(
        nProp(nLit("data-dh-island-value"), islandsDirective.value),
      );
    }
  }

  const significantChildren = node.children.filter((child) => {
    if (child.type === "JSXText") return child.value.trim() !== "";
    if (isJSXExpressionContainer(child))
      return !isJSXEmptyExpression(child.expression);
    return true;
  });

  if (significantChildren.length > 0) {
    const childExprs: ESTNode[] = [];

    for (const child of significantChildren) {
      if (child.type === "JSXText") {
        const text = child.value.trim();
        if (text) childExprs.push(nLit(text));
        continue;
      }

      if (isJSXExpressionContainer(child)) {
        if (!isJSXEmptyExpression(child.expression)) {
          childExprs.push(
            containsJSXNode(child.expression)
              ? transformNestedJSX(child.expression, state, nested)
              : child.expression,
          );
        }
        continue;
      }

      if (isJSXSpreadChild(child)) {
        childExprs.push(transformNestedJSX(child.expression, state, nested));
        continue;
      }

      if (isJSXElement(child)) {
        if (isComponentTag(child.openingElement.name)) {
          childExprs.push(buildComponentCall(child, state, nested));
        } else {
          childExprs.push(
            state.mode === "ssr"
              ? nested.transformJSXForSSRNode(child, state, nested)
              : nested.transformJSXNode(child, state, nested),
          );
        }
        continue;
      }

      if (isJSXFragment(child)) {
        for (const fragChild of child.children) {
          if (fragChild.type === "JSXText") {
            const text = fragChild.value.trim();
            if (text) childExprs.push(nLit(text));
            continue;
          }

          if (isJSXExpressionContainer(fragChild)) {
            if (!isJSXEmptyExpression(fragChild.expression)) {
              childExprs.push(
                containsJSXNode(fragChild.expression)
                  ? transformNestedJSX(fragChild.expression, state, nested)
                  : fragChild.expression,
              );
            }
            continue;
          }

          if (isJSXSpreadChild(fragChild)) {
            childExprs.push(
              transformNestedJSX(fragChild.expression, state, nested),
            );
            continue;
          }

          if (isJSXElement(fragChild)) {
            if (isComponentTag(fragChild.openingElement.name)) {
              childExprs.push(buildComponentCall(fragChild, state, nested));
            } else {
              childExprs.push(
                state.mode === "ssr"
                  ? nested.transformJSXForSSRNode(fragChild, state, nested)
                  : nested.transformJSXNode(fragChild, state, nested),
              );
            }
          }
        }
      }
    }

    const onlyChild = childExprs[0];
    if (childExprs.length === 1 && onlyChild !== undefined) {
      propsProperties.push(nProp(nId("children"), onlyChild));
    } else if (childExprs.length > 1) {
      propsProperties.push(nProp(nId("children"), nArr(childExprs)));
    }
  }

  return {
    type: "CallExpression",
    callee: componentRef,
    arguments: [nObj(propsProperties)],
    optional: false,
  };
}

/**
 * Recursively transform any JSX nodes embedded within an arbitrary expression.
 */
function transformNestedJSX(
  expr: ESTNode,
  state: TransformState,
  nested: NestedTransformers,
): ESTNode {
  return walk(expr, null, {
    JSXElement(node: ESTNode) {
      const el = node as JSXElement;
      if (isComponentTag(el.openingElement.name)) {
        return buildComponentCall(el, state, nested);
      }
      if (state.mode === "ssr") {
        return nested.transformJSXForSSRNode(el, state, nested);
      }
      return nested.transformJSXNode(el, state, nested);
    },
    JSXFragment(node: ESTNode) {
      if (state.mode === "ssr") {
        return nested.transformJSXForSSRNode(
          node as JSXFragment,
          state,
          nested,
        );
      }
      return nested.transformJSXNode(node as JSXFragment, state, nested);
    },
  });
}

/**
 * Check if a key is an event handler.
 */
function isEventHandlerKey(key: string): boolean {
  return (
    key.startsWith("on") && key.length > 2 && key[2] === key[2].toUpperCase()
  );
}

/**
 * Convert event key to event type.
 */
function getEventType(key: string): string {
  return key.slice(2).toLowerCase();
}

/**
 * Process JSX attributes.
 */
function processAttributes(
  attributes: (JSXAttribute | JSXSpreadAttribute)[],
  dynamicParts: DynamicPart[],
  path: number[],
  state: TransformState,
  colocatedClientState: ColocatedClientState,
): ProcessedAttributes {
  const staticProps: ESTNode[] = [];
  const events: { type: string; handler: ESTNode }[] = [];
  const spreads: ESTNode[] = [];

  for (const attr of attributes) {
    if (attr.type === "JSXSpreadAttribute") {
      spreads.push(attr.argument);
      continue;
    }

    if (getIslandsDirectiveName(attr.name) !== null) {
      throw new Error(
        "[dathomir] client:* directives are only supported on component elements",
      );
    }

    const colocatedClientDirective = getColocatedClientDirective(attr.name);
    if (colocatedClientDirective !== null) {
      if (
        !isJSXExpressionContainer(attr.value) ||
        isJSXEmptyExpression(attr.value.expression)
      ) {
        throw new Error(
          `[dathomir] ${colocatedClientDirective.strategy}:onClick requires an inline handler expression`,
        );
      }

      if (
        colocatedClientState.strategy !== null &&
        colocatedClientState.strategy !== colocatedClientDirective.strategy
      ) {
        throw new Error(
          "[dathomir] Mixed colocated client strategies are not supported in one JSX root",
        );
      }

      colocatedClientState.strategy = colocatedClientDirective.strategy;
      const targetId = createClientTargetId(state);
      staticProps.push(
        nProp(nLit("data-dh-client-target"), nLit(targetId)),
        nProp(
          nLit("data-dh-client-strategy"),
          nLit(colocatedClientDirective.strategy),
        ),
      );
      events.push({
        type: colocatedClientDirective.event,
        handler: attr.value.expression,
      });
      continue;
    }

    const unsupportedColocatedDirectiveError =
      getUnsupportedColocatedDirectiveError(attr.name);
    if (unsupportedColocatedDirectiveError !== null) {
      throw new Error(`[dathomir] ${unsupportedColocatedDirectiveError}`);
    }

    if (isClientDirectiveNamespace(attr.name)) {
      throwUnknownClientDirective(attr.name);
    }

    const key = getAttributeName(attr.name);
    if (key === null) continue;
    const keyNode = isValidIdentifier(key) ? nId(key) : nLit(key);
    const computed = !isValidIdentifier(key);
    const value = attr.value;

    if (value === null) {
      staticProps.push(nProp(keyNode, nLit(true), computed));
      continue;
    }

    if (isStringLiteral(value)) {
      staticProps.push(nProp(keyNode, value, computed));
      continue;
    }

    if (isJSXExpressionContainer(value)) {
      const expr = value.expression;
      if (isJSXEmptyExpression(expr)) continue;

      if (isEventHandlerKey(key)) {
        events.push({ type: getEventType(key), handler: expr });
      } else if (containsReactiveAccess(expr)) {
        dynamicParts.push({ type: "attr", path, expression: expr, key });
      } else {
        dynamicParts.push({ type: "attr", path, expression: expr, key });
      }
    }
  }

  return {
    attrs: staticProps.length > 0 ? nObj(staticProps) : nLit(null),
    events,
    spreads,
  };
}

/**
 * Convert a single JSX element to a tree node result.
 */
function jsxElementToTree(
  node: JSXElement,
  state: TransformState,
  dynamicParts: DynamicPart[],
  path: number[],
  nested: NestedTransformers,
): TreeResult {
  const opening = node.openingElement;
  const tagName = getTagName(opening.name);

  const { attrs, events, spreads } = processAttributes(
    opening.attributes,
    dynamicParts,
    path,
    state,
    state.currentColocatedClientState ?? { strategy: null },
  );

  const children = processChildren(
    node.children,
    state,
    dynamicParts,
    path,
    nested,
  );

  const treeElements: ESTNode[] = [
    nLit(tagName),
    attrs,
    ...children.map((c) => c.tree),
  ];

  for (const evt of events) {
    dynamicParts.push({
      type: "event",
      path,
      expression: evt.handler,
      key: evt.type,
    });
  }

  for (const spread of spreads) {
    dynamicParts.push({ type: "spread", path, expression: spread });
  }

  return {
    tree: nArr(treeElements),
    // Dynamic parts are collected via the `dynamicParts` parameter (by reference).
    // The returned array is unused by callers; kept empty for TreeResult conformance.
    dynamicParts: [],
  };
}

/**
 * Process JSX children into tree results.
 */
function processChildren(
  children: JSXChild[],
  state: TransformState,
  dynamicParts: DynamicPart[],
  parentPath: number[],
  nested: NestedTransformers,
): TreeResult[] {
  const results: TreeResult[] = [];
  let childIndex = 0;

  for (const child of children) {
    if (child.type === "JSXText") {
      const text = child.value.trim();
      if (text) {
        results.push({ tree: nLit(text), dynamicParts: [] });
        childIndex++;
      }
      continue;
    }

    if (isJSXElement(child)) {
      if (isComponentTag(child.openingElement.name)) {
        dynamicParts.push({
          type: "insert",
          isComponent: true,
          path: [...parentPath, childIndex],
          expression: buildComponentCall(child, state, nested),
        });
        results.push({
          tree: nArr([nLit("{insert}"), nLit(null)]),
          dynamicParts: [],
        });
        childIndex++;
        continue;
      }

      const childPath = [...parentPath, childIndex];
      results.push(
        jsxElementToTree(child, state, dynamicParts, childPath, nested),
      );
      childIndex++;
      continue;
    }

    if (isJSXFragment(child)) {
      const processed = processChildren(
        child.children,
        state,
        dynamicParts,
        parentPath,
        nested,
      );
      results.push(...processed);
      childIndex += processed.length;
      continue;
    }

    if (isJSXSpreadChild(child)) {
      dynamicParts.push({
        type: "insert",
        path: [...parentPath, childIndex],
        expression: transformNestedJSX(child.expression, state, nested),
      });
      results.push({
        tree: nArr([nLit("{insert}"), nLit(null)]),
        dynamicParts: [],
      });
      childIndex++;
      continue;
    }

    if (isJSXExpressionContainer(child)) {
      const expr = child.expression;
      if (isJSXEmptyExpression(expr)) continue;

      if (isMapCallExpression(expr)) {
        dynamicParts.push({
          type: "insert",
          path: [...parentPath, childIndex],
          expression: transformNestedJSX(expr, state, nested),
        });
        results.push({
          tree: nArr([nLit("{each}"), nLit(null)]),
          dynamicParts: [],
        });
        childIndex++;
        continue;
      }

      if (isCallExpression(expr) || expr.type === "ConditionalExpression") {
        dynamicParts.push({
          type: "insert",
          path: [...parentPath, childIndex],
          expression: transformNestedJSX(expr, state, nested),
        });
        results.push({
          tree: nArr([nLit("{insert}"), nLit(null)]),
          dynamicParts: [],
        });
        childIndex++;
        continue;
      }

      if (expr.type === "LogicalExpression" || containsJSXNode(expr)) {
        dynamicParts.push({
          type: "insert",
          path: [...parentPath, childIndex],
          expression: transformNestedJSX(expr, state, nested),
        });
        results.push({
          tree: nArr([nLit("{insert}"), nLit(null)]),
          dynamicParts: [],
        });
        childIndex++;
        continue;
      }

      dynamicParts.push({
        type: "text",
        path: [...parentPath, childIndex],
        expression: expr,
      });
      results.push({
        tree: nArr([nLit("{text}"), nLit(null)]),
        dynamicParts: [],
      });
      childIndex++;
    }
  }

  return results;
}

/**
 * Convert JSX element/fragment to structured array tree.
 */
function jsxToTree(
  node: JSXElement | JSXFragment,
  state: TransformState,
  nested: NestedTransformers,
): { tree: ESTNode; dynamicParts: DynamicPart[] } {
  const dynamicParts: DynamicPart[] = [];
  const scopedState = state as TransformState & {
    currentColocatedClientState?: ColocatedClientState;
  };
  const previousColocatedClientState = scopedState.currentColocatedClientState;
  const colocatedClientState = previousColocatedClientState ?? {
    strategy: null,
  };
  scopedState.currentColocatedClientState = colocatedClientState;

  if (node.type === "JSXFragment") {
    const children = processChildren(
      node.children,
      scopedState,
      dynamicParts,
      [],
      nested,
    );
    const result = {
      tree: nArr(children.map((c) => c.tree)),
      dynamicParts,
    };
    scopedState.currentColocatedClientState = previousColocatedClientState;
    return result;
  }

  const result = jsxElementToTree(node, scopedState, dynamicParts, [0], nested);
  scopedState.currentColocatedClientState = previousColocatedClientState;
  return { tree: nArr([result.tree]), dynamicParts };
}

function isMapCallExpression(expr: ESTNode): expr is CallExpression {
  if (!isCallExpression(expr)) return false;
  if (!isMemberExpression(expr.callee)) return false;
  const method = expr.callee.property;
  return isIdentifier(method) && method.name === "map";
}

function containsJSXNode(expr: ESTNode): boolean {
  if (expr.type === "JSXElement" || expr.type === "JSXFragment") {
    return true;
  }

  let found = false;
  walk(expr, null, {
    JSXElement() {
      found = true;
    },
    JSXFragment() {
      found = true;
    },
  });

  return found;
}

function getAttributeName(name: JSXAttribute["name"]): string | null {
  if (name.type === "JSXIdentifier") {
    return name.name;
  }

  if (name.type === "JSXNamespacedName") {
    return `${name.namespace.name}:${name.name.name}`;
  }

  return null;
}

function isJSXElement(node: ESTNode): node is JSXElement {
  return node.type === "JSXElement";
}

function isJSXFragment(node: ESTNode): node is JSXFragment {
  return node.type === "JSXFragment";
}

function isJSXExpressionContainer(
  node: ESTNode,
): node is JSXExpressionContainer {
  return node.type === "JSXExpressionContainer";
}

function isJSXEmptyExpression(node: ESTNode): node is JSXEmptyExpression {
  return node.type === "JSXEmptyExpression";
}

function isJSXSpreadChild(node: ESTNode): node is JSXSpreadChild {
  return node.type === "JSXSpreadChild";
}

export {
  buildComponentCall,
  containsReactiveAccess,
  jsxElementToTree,
  jsxToTree,
  processAttributes,
  processChildren,
};
export type {
  DynamicPart,
  NestedTransformers,
  ProcessedAttributes,
  TreeResult,
};
