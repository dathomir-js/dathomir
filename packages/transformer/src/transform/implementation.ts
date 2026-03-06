import { parseSync } from "oxc-parser";
import { walk } from "zimmerframe";
import { print } from "esrap";
import ts from "esrap/languages/ts";
import type { TransformOptions, TransformResult } from "../types";

// ---------------------------------------------------------------------------
// ESTree node types (minimal subset used by this transformer)
// ---------------------------------------------------------------------------

/** A generic ESTree node with a `type` discriminant. */
interface ESTNode {
  type: string;
  [key: string]: unknown;
}

/** ESTree Literal (string, number, boolean, null). */
interface Literal extends ESTNode {
  type: "Literal";
  value: string | number | boolean | null;
  raw: string;
}

/** ESTree Identifier. */
interface Identifier extends ESTNode {
  type: "Identifier";
  name: string;
}

/** ESTree CallExpression. */
interface CallExpression extends ESTNode {
  type: "CallExpression";
  callee: ESTNode;
  arguments: ESTNode[];
  optional: boolean;
}

/** ESTree ArrowFunctionExpression. */
interface ArrowFunctionExpression extends ESTNode {
  type: "ArrowFunctionExpression";
  params: ESTNode[];
  body: ESTNode;
  expression: boolean;
}

/** ESTree BlockStatement. */
interface BlockStatement extends ESTNode {
  type: "BlockStatement";
  body: ESTNode[];
}

/** ESTree VariableDeclaration. */
interface VariableDeclaration extends ESTNode {
  type: "VariableDeclaration";
  kind: "const" | "let" | "var";
  declarations: ESTNode[];
}

/** ESTree ReturnStatement. */
interface ReturnStatement extends ESTNode {
  type: "ReturnStatement";
  argument: ESTNode | null;
}

/** ESTree Program. */
interface Program extends ESTNode {
  type: "Program";
  body: ESTNode[];
}

// ---------------------------------------------------------------------------
// ESTree node builder helpers
// ---------------------------------------------------------------------------

/** Build a Literal node. */
function nLit(value: string | number | boolean | null): Literal {
  if (value === null) return { type: "Literal", value: null, raw: "null" };
  if (typeof value === "string")
    return { type: "Literal", value, raw: JSON.stringify(value) };
  return { type: "Literal", value, raw: String(value) };
}

/** Build an Identifier node. */
function nId(name: string): Identifier {
  return { type: "Identifier", name };
}

/** Build a CallExpression node. */
function nCall(callee: ESTNode, args: ESTNode[]): CallExpression {
  return { type: "CallExpression", callee, arguments: args, optional: false };
}

/** Build an ArrayExpression node. */
function nArr(elements: (ESTNode | null)[]): ESTNode {
  return { type: "ArrayExpression", elements };
}

/** Build an ObjectExpression node. */
function nObj(properties: ESTNode[]): ESTNode {
  return { type: "ObjectExpression", properties };
}

/**
 * Build a Property node (ESTree object property).
 * @param key - The key node (Identifier or Literal).
 * @param value - The value node.
 * @param computed - Whether the key is a computed expression.
 */
function nProp(key: ESTNode, value: ESTNode, computed = false): ESTNode {
  return {
    type: "Property",
    key,
    value,
    kind: "init",
    computed,
    method: false,
    shorthand: false,
  };
}

/** Build an ArrowFunctionExpression with block body. */
function nArrowBlock(params: ESTNode[], body: BlockStatement): ArrowFunctionExpression {
  return {
    type: "ArrowFunctionExpression",
    params,
    body,
    expression: false,
  };
}

/** Build a BlockStatement. */
function nBlock(stmts: ESTNode[]): BlockStatement {
  return { type: "BlockStatement", body: stmts };
}

/** Build a const VariableDeclaration. */
function nConst(id: ESTNode, init: ESTNode): VariableDeclaration {
  return {
    type: "VariableDeclaration",
    kind: "const",
    declarations: [{ type: "VariableDeclarator", id, init }],
  };
}

/** Build an ExpressionStatement. */
function nExprStmt(expr: ESTNode): ESTNode {
  return { type: "ExpressionStatement", expression: expr };
}

/** Build a ReturnStatement. */
function nReturn(arg: ESTNode): ReturnStatement {
  return { type: "ReturnStatement", argument: arg };
}

/** Build a SpreadElement (for array spread / function spread). */
function nSpread(arg: ESTNode): ESTNode {
  return { type: "SpreadElement", argument: arg };
}

/** Build a MemberExpression. */
function nMember(object: ESTNode, property: ESTNode, computed = false): ESTNode {
  return {
    type: "MemberExpression",
    object,
    property,
    computed,
    optional: false,
  };
}

/** Build a NewExpression. */
function nNew(callee: ESTNode, args: ESTNode[]): ESTNode {
  return { type: "NewExpression", callee, arguments: args };
}

/** Build an ImportDeclaration. */
function nImport(specifiers: ESTNode[], source: string): ESTNode {
  return {
    type: "ImportDeclaration",
    specifiers,
    source: nLit(source),
    importKind: "value",
  };
}

/** Build an ImportSpecifier (named import). */
function nImportSpecifier(name: string): ESTNode {
  return {
    type: "ImportSpecifier",
    imported: nId(name),
    local: nId(name),
    importKind: "value",
  };
}

// ---------------------------------------------------------------------------
// JSX node type helpers (oxc-parser output shape)
// ---------------------------------------------------------------------------

interface JSXIdentifier {
  type: "JSXIdentifier";
  name: string;
}

interface JSXMemberExpression {
  type: "JSXMemberExpression";
  object: JSXIdentifier | JSXMemberExpression;
  property: JSXIdentifier;
}

interface JSXNamespacedName {
  type: "JSXNamespacedName";
  namespace: JSXIdentifier;
  name: JSXIdentifier;
}

type JSXName = JSXIdentifier | JSXMemberExpression | JSXNamespacedName;

interface JSXAttribute {
  type: "JSXAttribute";
  name: JSXIdentifier | JSXNamespacedName;
  value: ESTNode | null;
}

interface JSXSpreadAttribute {
  type: "JSXSpreadAttribute";
  argument: ESTNode;
}

interface JSXElement {
  type: "JSXElement";
  openingElement: {
    type: "JSXOpeningElement";
    name: JSXName;
    attributes: (JSXAttribute | JSXSpreadAttribute)[];
    selfClosing: boolean;
  };
  children: JSXChild[];
  closingElement: ESTNode | null;
}

interface JSXFragment {
  type: "JSXFragment";
  children: JSXChild[];
}

interface JSXText {
  type: "JSXText";
  value: string;
}

interface JSXExpressionContainer {
  type: "JSXExpressionContainer";
  expression: ESTNode;
}

interface JSXEmptyExpression {
  type: "JSXEmptyExpression";
}

type JSXChild =
  | JSXElement
  | JSXFragment
  | JSXText
  | JSXExpressionContainer
  | ESTNode;

// ---------------------------------------------------------------------------
// Runtime import tracking
// ---------------------------------------------------------------------------

type RuntimeImportName =
  | "fromTree"
  | "firstChild"
  | "nextSibling"
  | "setText"
  | "setAttr"
  | "setProp"
  | "spread"
  | "event"
  | "templateEffect"
  | "createRoot"
  | "reconcile"
  | "insert"
  | "renderToString"
  | "renderTree"
  | "serializeState"
  | "createMarker"
  | "MarkerType";

// ---------------------------------------------------------------------------
// Transform state
// ---------------------------------------------------------------------------

interface TransformState {
  templateCount: number;
  templates: VariableDeclaration[];
  runtimeImports: Set<RuntimeImportName>;
  mode: "csr" | "ssr";
}

// ---------------------------------------------------------------------------
// Dynamic part descriptors
// ---------------------------------------------------------------------------

interface DynamicPart {
  type: "text" | "attr" | "event" | "spread" | "insert";
  /** When true (component insert), skip templateEffect wrapping. */
  isComponent?: boolean;
  path: number[];
  expression: ESTNode;
  key?: string;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Create a unique template identifier for the current state. */
function createTemplateId(state: TransformState): Identifier {
  return nId(`_t${++state.templateCount}`);
}

/**
 * Check if a string is a valid JavaScript identifier.
 * Attribute names like "data-foo" or "aria-label" are not valid identifiers
 * and must be quoted as string literal keys in object expressions.
 */
function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

/**
 * Check if a node contains reactive access (.value).
 * Uses a simple recursive walk rather than a full traversal to keep things fast.
 */
function containsReactiveAccess(node: ESTNode): boolean {
  if (
    node.type === "MemberExpression" &&
    (node.property as ESTNode | undefined)?.type === "Identifier" &&
    ((node.property as Identifier).name === "value")
  ) {
    return true;
  }

  let found = false;
  walk(node, null, {
    MemberExpression(n: ESTNode, { next }: { next: () => void }) {
      const prop = (n as Record<string, unknown>)["property"] as ESTNode | undefined;
      if (
        prop?.type === "Identifier" &&
        (prop as Identifier).name === "value"
      ) {
        found = true;
      }
      if (!found) next();
    },
  });
  return found;
}

/**
 * Check if a JSX element name represents a component (starts with uppercase).
 * Per JSX convention: uppercase = component, lowercase = HTML element.
 * JSXMemberExpression (e.g. Foo.Bar) is always a component.
 */
function isComponentTag(name: JSXName): boolean {
  if (name.type === "JSXIdentifier") {
    return /^[A-Z]/.test((name as JSXIdentifier).name);
  }
  if (name.type === "JSXMemberExpression") {
    return true;
  }
  return false;
}

/**
 * Convert a JSX element name to an ESTree expression node for function call.
 * e.g. Counter → Identifier("Counter"), Foo.Bar → MemberExpression(Foo, Bar)
 */
function jsxNameToExpression(name: JSXName): ESTNode {
  if (name.type === "JSXIdentifier") {
    return nId((name as JSXIdentifier).name);
  }
  if (name.type === "JSXMemberExpression") {
    const m = name as JSXMemberExpression;
    return nMember(jsxNameToExpression(m.object), nId(m.property.name));
  }
  // JSXNamespacedName: convert to "ns_local" identifier
  const ns = name as JSXNamespacedName;
  return nId(`${ns.namespace.name}_${ns.name.name}`);
}

/**
 * Get tag name string from JSX name node.
 */
function getTagName(name: JSXName): string {
  if (name.type === "JSXIdentifier") {
    return (name as JSXIdentifier).name;
  }
  if (name.type === "JSXMemberExpression") {
    const m = name as JSXMemberExpression;
    return `${getTagName(m.object)}.${m.property.name}`;
  }
  const ns = name as JSXNamespacedName;
  return `${ns.namespace.name}:${ns.name.name}`;
}

/**
 * Check if a JSX attribute value is a string literal (ESTree Literal with string value).
 */
function isStringLiteral(node: ESTNode | null): node is Literal {
  return (
    node !== null &&
    node.type === "Literal" &&
    typeof (node as Literal).value === "string"
  );
}

/**
 * Check if a node is a JSXEmptyExpression.
 */
function isJSXEmptyExpression(node: ESTNode): node is JSXEmptyExpression {
  return node.type === "JSXEmptyExpression";
}

// ---------------------------------------------------------------------------
// Component call builder
// ---------------------------------------------------------------------------

/**
 * Build a component function call expression from a JSX element.
 * Converts <Counter initialCount={5} /> into Counter({ initialCount: 5 }).
 * Children are passed as the `children` prop.
 */
function buildComponentCall(
  node: JSXElement,
  state: TransformState,
): ESTNode {
  const opening = node.openingElement;
  const componentRef = jsxNameToExpression(opening.name);

  // Build props object from attributes
  const propsProperties: ESTNode[] = [];

  for (const attr of opening.attributes) {
    if (attr.type === "JSXSpreadAttribute") {
      propsProperties.push(nSpread((attr as JSXSpreadAttribute).argument));
      continue;
    }

    const jsxAttr = attr as JSXAttribute;
    if (jsxAttr.name.type !== "JSXIdentifier") continue;

    const key = (jsxAttr.name as JSXIdentifier).name;
    let value: ESTNode;

    if (jsxAttr.value === null) {
      value = nLit(true);
    } else if (isStringLiteral(jsxAttr.value as ESTNode)) {
      value = jsxAttr.value as ESTNode;
    } else if ((jsxAttr.value as ESTNode).type === "JSXExpressionContainer") {
      const container = jsxAttr.value as JSXExpressionContainer;
      if (isJSXEmptyExpression(container.expression)) continue;
      value = container.expression;
    } else {
      continue;
    }

    propsProperties.push(
      nProp(
        isValidIdentifier(key) ? nId(key) : nLit(key),
        value,
        !isValidIdentifier(key),
      ),
    );
  }

  // Handle children
  const significantChildren = node.children.filter((c) => {
    const child = c as ESTNode;
    if (child.type === "JSXText")
      return ((child as JSXText).value.trim() !== "");
    if (child.type === "JSXExpressionContainer")
      return !isJSXEmptyExpression((child as JSXExpressionContainer).expression);
    return true;
  });

  if (significantChildren.length > 0) {
    const childExprs: ESTNode[] = [];

    for (const rawChild of significantChildren) {
      const child = rawChild as ESTNode;

      if (child.type === "JSXText") {
        const text = (child as JSXText).value.trim();
        if (text) childExprs.push(nLit(text));
      } else if (child.type === "JSXExpressionContainer") {
        const container = child as JSXExpressionContainer;
        if (!isJSXEmptyExpression(container.expression)) {
          childExprs.push(container.expression);
        }
      } else if (child.type === "JSXElement") {
        const jsxEl = child as JSXElement;
        if (isComponentTag(jsxEl.openingElement.name)) {
          childExprs.push(buildComponentCall(jsxEl, state));
        } else {
          childExprs.push(
            state.mode === "ssr"
              ? transformJSXForSSRNode(jsxEl, state)
              : transformJSXNode(jsxEl, state),
          );
        }
      } else if (child.type === "JSXFragment") {
        for (const fragRaw of (child as JSXFragment).children) {
          const fragChild = fragRaw as ESTNode;
          if (fragChild.type === "JSXText") {
            const text = (fragChild as JSXText).value.trim();
            if (text) childExprs.push(nLit(text));
          } else if (fragChild.type === "JSXExpressionContainer") {
            const container = fragChild as JSXExpressionContainer;
            if (!isJSXEmptyExpression(container.expression)) {
              childExprs.push(container.expression);
            }
          } else if (fragChild.type === "JSXElement") {
            const el = fragChild as JSXElement;
            if (isComponentTag(el.openingElement.name)) {
              childExprs.push(buildComponentCall(el, state));
            } else {
              childExprs.push(
                state.mode === "ssr"
                  ? transformJSXForSSRNode(el, state)
                  : transformJSXNode(el, state),
              );
            }
          }
        }
      }
    }

    if (childExprs.length === 1) {
      propsProperties.push(nProp(nId("children"), childExprs[0]!));
    } else if (childExprs.length > 1) {
      propsProperties.push(nProp(nId("children"), nArr(childExprs)));
    }
  }

  return nCall(componentRef, [nObj(propsProperties)]);
}

// ---------------------------------------------------------------------------
// Tree builder (JSX → structured array)
// ---------------------------------------------------------------------------

interface TreeResult {
  tree: ESTNode;
  dynamicParts: DynamicPart[];
}

/**
 * Convert JSX element/fragment to structured array tree.
 */
function jsxToTree(
  node: JSXElement | JSXFragment,
  state: TransformState,
): { tree: ESTNode; dynamicParts: DynamicPart[] } {
  const dynamicParts: DynamicPart[] = [];

  if (node.type === "JSXFragment") {
    const children = processChildren(
      (node as JSXFragment).children,
      state,
      dynamicParts,
      [],
    );
    return {
      tree: nArr(children.map((c) => c.tree)),
      // dynamicParts is mutated in-place by processChildren (via push); return
      // the local variable directly rather than children.flatMap(c => c.dynamicParts),
      // which is always empty because processChildren pushes into the parameter.
      dynamicParts,
    };
  }

  const result = jsxElementToTree(node as JSXElement, state, dynamicParts, [0]);
  return { tree: nArr([result.tree]), dynamicParts };
}

/**
 * Convert a single JSX element to a tree node result.
 */
function jsxElementToTree(
  node: JSXElement,
  state: TransformState,
  dynamicParts: DynamicPart[],
  path: number[],
): TreeResult {
  const opening = node.openingElement;
  const tagName = getTagName(opening.name);

  // Process attributes
  const { attrs, events, spreads } = processAttributes(
    opening.attributes,
    dynamicParts,
    path,
  );

  // Process children
  const children = processChildren(node.children, state, dynamicParts, path);

  // Build tree node: [tagName, attrs, ...children]
  const treeElements: ESTNode[] = [
    nLit(tagName),
    attrs,
    ...children.map((c) => c.tree),
  ];

  // Register events
  for (const evt of events) {
    dynamicParts.push({
      type: "event",
      path,
      expression: evt.handler,
      key: evt.type,
    });
  }

  // Register spreads
  for (const s of spreads) {
    dynamicParts.push({
      type: "spread",
      path,
      expression: s,
    });
  }

  return {
    tree: nArr(treeElements),
    dynamicParts: children.flatMap((c) => c.dynamicParts),
  };
}

// ---------------------------------------------------------------------------
// Attribute processor
// ---------------------------------------------------------------------------

interface ProcessedAttributes {
  attrs: ESTNode;
  events: { type: string; handler: ESTNode }[];
  spreads: ESTNode[];
}

/**
 * Process JSX attributes.
 */
function processAttributes(
  attributes: (JSXAttribute | JSXSpreadAttribute)[],
  dynamicParts: DynamicPart[],
  path: number[],
): ProcessedAttributes {
  const staticProps: ESTNode[] = [];
  const events: { type: string; handler: ESTNode }[] = [];
  const spreads: ESTNode[] = [];

  for (const attr of attributes) {
    if (attr.type === "JSXSpreadAttribute") {
      spreads.push((attr as JSXSpreadAttribute).argument);
      continue;
    }

    const jsxAttr = attr as JSXAttribute;
    if (jsxAttr.name.type !== "JSXIdentifier") continue;

    const key = (jsxAttr.name as JSXIdentifier).name;
    const keyNode = isValidIdentifier(key) ? nId(key) : nLit(key);
    const computed = !isValidIdentifier(key);
    const value = jsxAttr.value as ESTNode | null;

    if (value === null) {
      // Boolean attribute: <button disabled />
      staticProps.push(nProp(keyNode, nLit(true), computed));
      continue;
    }

    if (isStringLiteral(value)) {
      // Static string attribute
      staticProps.push(nProp(keyNode, value, computed));
      continue;
    }

    if (value.type === "JSXExpressionContainer") {
      const container = value as JSXExpressionContainer;
      const expr = container.expression;
      if (isJSXEmptyExpression(expr)) continue;

      if (isEventHandlerKey(key)) {
        // Event handler
        events.push({ type: getEventType(key), handler: expr });
      } else if (containsReactiveAccess(expr)) {
        // Dynamic attribute with reactive access
        dynamicParts.push({ type: "attr", path, expression: expr, key });
      } else {
        // Static expression attribute (no reactive .value access)
        staticProps.push(nProp(keyNode, expr, computed));
      }
    }
  }

  return {
    attrs: staticProps.length > 0 ? nObj(staticProps) : nLit(null),
    events,
    spreads,
  };
}

// ---------------------------------------------------------------------------
// Children processor
// ---------------------------------------------------------------------------

/**
 * Process JSX children into tree results.
 */
function processChildren(
  children: JSXChild[],
  state: TransformState,
  dynamicParts: DynamicPart[],
  parentPath: number[],
): TreeResult[] {
  const results: TreeResult[] = [];
  let childIndex = 0;

  for (const rawChild of children) {
    const child = rawChild as ESTNode;

    if (child.type === "JSXText") {
      // Skip whitespace-only text
      const text = (child as JSXText).value.trim();
      if (text) {
        results.push({ tree: nLit(text), dynamicParts: [] });
        childIndex++;
      }
      continue;
    }

    if (child.type === "JSXElement") {
      const el = child as JSXElement;
      if (isComponentTag(el.openingElement.name)) {
        // Component elements → function call + insert placeholder
        const callExpr = buildComponentCall(el, state);
        dynamicParts.push({
          type: "insert",
          isComponent: true,
          path: [...parentPath, childIndex],
          expression: callExpr,
        });
        results.push({
          tree: nArr([nLit("{insert}"), nLit(null)]),
          dynamicParts: [],
        });
        childIndex++;
        continue;
      }
      // HTML elements → tree node
      const childPath = [...parentPath, childIndex];
      results.push(jsxElementToTree(el, state, dynamicParts, childPath));
      childIndex++;
      continue;
    }

    if (child.type === "JSXFragment") {
      const processed = processChildren(
        (child as JSXFragment).children,
        state,
        dynamicParts,
        parentPath,
      );
      results.push(...processed);
      childIndex += processed.length;
      continue;
    }

    if (child.type === "JSXExpressionContainer") {
      const container = child as JSXExpressionContainer;
      const expr = container.expression;
      if (isJSXEmptyExpression(expr)) continue;

      // Check if it's a .map() call (list rendering)
      if (
        expr.type === "CallExpression" &&
        (expr as CallExpression).callee.type === "MemberExpression"
      ) {
        const callee = (expr as CallExpression).callee as Record<string, unknown>;
        const method = callee["property"] as ESTNode | undefined;
        if (method?.type === "Identifier" && (method as Identifier).name === "map") {
          // Transform any JSX inside the .map() callback
          const transformed = transformNestedJSX(expr, state);
          dynamicParts.push({
            type: "insert",
            path: [...parentPath, childIndex],
            expression: transformed,
          });
          results.push({
            tree: nArr([nLit("{each}"), nLit(null)]),
            dynamicParts: [],
          });
          childIndex++;
          continue;
        }
      }

      // Check if it's any other function call (component or computed insert)
      if (expr.type === "CallExpression") {
        const transformed = transformNestedJSX(expr, state);
        dynamicParts.push({
          type: "insert",
          path: [...parentPath, childIndex],
          expression: transformed,
        });
        results.push({
          tree: nArr([nLit("{insert}"), nLit(null)]),
          dynamicParts: [],
        });
        childIndex++;
        continue;
      }

      // Check if it's a conditional expression (ternary)
      if (expr.type === "ConditionalExpression") {
        // Transform any JSX inside the conditional branches
        const transformed = transformNestedJSX(expr, state);
        dynamicParts.push({
          type: "insert",
          path: [...parentPath, childIndex],
          expression: transformed,
        });
        results.push({
          tree: nArr([nLit("{insert}"), nLit(null)]),
          dynamicParts: [],
        });
        childIndex++;
        continue;
      }

      // Dynamic text content
      const childPath = [...parentPath, childIndex];
      dynamicParts.push({ type: "text", path: childPath, expression: expr });
      results.push({
        tree: nArr([nLit("{text}"), nLit(null)]),
        dynamicParts: [],
      });
      childIndex++;
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Nested JSX transformer
// ---------------------------------------------------------------------------

/**
 * Recursively transform any JSX nodes embedded within an arbitrary expression.
 *
 * Expressions like conditional ternaries (`cond ? <A/> : <B/>`) and `.map()`
 * callbacks contain JSX elements that are not top-level in the program. They
 * must be transformed before being stored in dynamicParts, because esrap does
 * not understand JSX syntax.
 */
function transformNestedJSX(expr: ESTNode, state: TransformState): ESTNode {
  return walk(expr, null, {
    JSXElement(node: ESTNode, { next: _next }: { next: () => void }) {
      const el = node as unknown as JSXElement;
      if (isComponentTag(el.openingElement.name)) {
        return buildComponentCall(el, state) as unknown as ESTNode;
      }
      // Transform nested HTML JSX (does NOT recurse into its own children via
      // zimmerframe since we return without calling next())
      return transformJSXNode(el, state) as unknown as ESTNode;
    },
    JSXFragment(node: ESTNode, { next: _next }: { next: () => void }) {
      return transformJSXNode(
        node as unknown as JSXFragment,
        state,
      ) as unknown as ESTNode;
    },
  }) as unknown as ESTNode;
}

// ---------------------------------------------------------------------------
// Event handler helpers
// ---------------------------------------------------------------------------

/**
 * Check if a key is an event handler (onClick, onInput, etc.).
 */
function isEventHandlerKey(key: string): boolean {
  return (
    key.startsWith("on") && key.length > 2 && key[2] === key[2].toUpperCase()
  );
}

/**
 * Convert event key to event type (onClick -> click).
 */
function getEventType(key: string): string {
  return key.slice(2).toLowerCase();
}

// ---------------------------------------------------------------------------
// DOM navigation code generator
// ---------------------------------------------------------------------------

/**
 * Generate navigation code to reach a node at a given path.
 */
function generateNavigation(
  fragmentId: Identifier,
  path: number[],
  state: TransformState,
): ESTNode {
  state.runtimeImports.add("firstChild");

  let expr: ESTNode = nCall(nId("firstChild"), [fragmentId]);

  for (let i = 0; i < path.length; i++) {
    const index = path[i]!;

    if (i === 0 && index === 0) {
      // Already at first child
    } else if (i === 0) {
      // Navigate to nth sibling
      for (let j = 0; j < index; j++) {
        state.runtimeImports.add("nextSibling");
        expr = nCall(nId("nextSibling"), [expr]);
      }
    } else {
      // Navigate into children
      expr = nCall(nId("firstChild"), [expr]);
      for (let j = 0; j < index; j++) {
        state.runtimeImports.add("nextSibling");
        expr = nCall(nId("nextSibling"), [expr]);
      }
    }
  }

  return expr;
}

// ---------------------------------------------------------------------------
// CSR transformer
// ---------------------------------------------------------------------------

/**
 * Transform a JSX element/fragment node to CSR DOM code.
 */
function transformJSXNode(
  node: JSXElement | JSXFragment,
  state: TransformState,
): ESTNode {
  const { tree, dynamicParts } = jsxToTree(node, state);

  // Create template factory: const _tN = fromTree(tree, 0);
  const templateId = createTemplateId(state);
  state.runtimeImports.add("fromTree");

  const templateDecl = nConst(
    templateId,
    nCall(nId("fromTree"), [tree, nLit(0)]),
  );
  state.templates.push(templateDecl);

  // Build setup statements inside IIFE
  const setupStatements: ESTNode[] = [];

  // Fragment variable: const _f = _tN();
  const fragmentId = nId("_f");
  setupStatements.push(nConst(fragmentId, nCall(templateId, [])));

  // Process dynamic parts
  for (const part of dynamicParts) {
    const nodeId = nId(`_n${part.path.join("_")}`);

    switch (part.type) {
      case "text": {
        state.runtimeImports.add("setText");
        state.runtimeImports.add("templateEffect");
        state.runtimeImports.add("firstChild");

        setupStatements.push(
          nConst(nodeId, generateNavigation(fragmentId, part.path, state)),
        );
        setupStatements.push(
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
        state.runtimeImports.add("templateEffect");

        setupStatements.push(
          nConst(nodeId, generateNavigation(fragmentId, part.path, state)),
        );
        setupStatements.push(
          nExprStmt(
            nCall(nId("templateEffect"), [
              nArrowBlock(
                [],
                nBlock([
                  nExprStmt(
                    nCall(nId("setAttr"), [
                      nodeId,
                      nLit(part.key!),
                      part.expression,
                    ]),
                  ),
                ]),
              ),
            ]),
          ),
        );
        break;
      }

      case "event": {
        state.runtimeImports.add("event");

        // Avoid re-declaring the node variable if it was already declared
        const alreadyDeclared = setupStatements.some(
          (s) =>
            s.type === "VariableDeclaration" &&
            ((s as VariableDeclaration).declarations[0] as Record<string, unknown>)?.["id"] &&
            (
              ((s as VariableDeclaration).declarations[0] as Record<string, unknown>)[
                "id"
              ] as Identifier
            )?.name === nodeId.name,
        );

        if (!alreadyDeclared) {
          setupStatements.push(
            nConst(nodeId, generateNavigation(fragmentId, part.path, state)),
          );
        }

        setupStatements.push(
          nExprStmt(
            nCall(nId("event"), [nLit(part.key!), nodeId, part.expression]),
          ),
        );
        break;
      }

      case "insert": {
        state.runtimeImports.add("insert");
        state.runtimeImports.add("firstChild");

        setupStatements.push(
          nConst(nodeId, generateNavigation(fragmentId, part.path, state)),
        );

        if (part.isComponent) {
          // Component inserts are called once — do NOT wrap in templateEffect.
          // Wrapping would cause the component to be re-created on every signal
          // change, resetting internal state (signals, effects, etc.).
          setupStatements.push(
            nExprStmt(
              nCall(nId("insert"), [
                nMember(nodeId, nId("parentNode")),
                part.expression,
                nodeId,
              ]),
            ),
          );
        } else {
          // Dynamic inserts (conditional expressions, list maps, etc.) are
          // wrapped in templateEffect so they re-evaluate on signal change.
          state.runtimeImports.add("templateEffect");
          setupStatements.push(
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

        const alreadyDeclared = setupStatements.some(
          (s) =>
            s.type === "VariableDeclaration" &&
            (
              ((s as VariableDeclaration).declarations[0] as Record<string, unknown>)[
                "id"
              ] as Identifier
            )?.name === nodeId.name,
        );

        if (!alreadyDeclared) {
          setupStatements.push(
            nConst(nodeId, generateNavigation(fragmentId, part.path, state)),
          );
        }

        setupStatements.push(
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

  // Return fragment
  setupStatements.push(nReturn(fragmentId));

  // Wrap in IIFE
  return nCall(nArrowBlock([], nBlock(setupStatements)), []);
}

// ---------------------------------------------------------------------------
// SSR transformer
// ---------------------------------------------------------------------------

/**
 * Transform a JSX element/fragment node to SSR render code.
 */
function transformJSXForSSRNode(
  node: JSXElement | JSXFragment,
  state: TransformState,
): ESTNode {
  const { tree, dynamicParts } = jsxToTree(node, state);

  state.runtimeImports.add("renderToString");

  const dynamicValueEntries: ESTNode[] = [];

  for (const part of dynamicParts) {
    if (
      part.type === "text" ||
      part.type === "insert" ||
      part.type === "attr" ||
      part.type === "spread"
    ) {
      dynamicValueEntries.push(
        nArr([nLit(dynamicValueEntries.length + 1), part.expression]),
      );
    }
    // Event handlers are not rendered in SSR HTML output; skip them
  }

  const dynamicValuesMap =
    dynamicValueEntries.length > 0
      ? nNew(nId("Map"), [nArr(dynamicValueEntries)])
      : nNew(nId("Map"), []);

  // renderToString(tree, {}, dynamicValuesMap)
  return nCall(nId("renderToString"), [
    tree,
    nObj([]),
    dynamicValuesMap,
  ]);
}

// ---------------------------------------------------------------------------
// Runtime import injection
// ---------------------------------------------------------------------------

/**
 * Add runtime imports to the program body.
 */
function addRuntimeImports(
  program: Program,
  imports: Set<RuntimeImportName>,
  runtimeModule: string,
): void {
  if (imports.size === 0) return;

  const specifiers = Array.from(imports).map((name) => nImportSpecifier(name));
  const importDecl = nImport(specifiers, runtimeModule);

  // Insert after any existing import declarations
  let insertIndex = 0;
  for (let i = 0; i < program.body.length; i++) {
    if (program.body[i]!.type === "ImportDeclaration") {
      insertIndex = i + 1;
    } else {
      break;
    }
  }

  program.body.splice(insertIndex, 0, importDecl);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Transform source code containing JSX.
 */
function transform(
  code: string,
  options: TransformOptions = {},
): TransformResult {
  const {
    mode = "csr",
    sourceMap = false,
    filename = "unknown.tsx",
    runtimeModule = "@dathomir/runtime",
  } = options;

  const parsed = parseSync(filename, code, { sourceType: "module" });

  const state: TransformState = {
    templateCount: 0,
    templates: [],
    runtimeImports: new Set(),
    mode,
  };

  // Transform JSX: walk the AST, replace root-level JSX elements only.
  // When we encounter a root JSX node we do NOT call next(), which prevents
  // zimmerframe from traversing into nested JSX children (they are handled
  // recursively by jsxToTree / processChildren).
  const transformedProgram = walk(parsed.program as ESTNode, { inJSX: false }, {
    JSXElement(
      node: ESTNode,
      { state: walkState, next }: { state: { inJSX: boolean }; next: (s?: { inJSX: boolean }) => void },
    ) {
      if (walkState.inJSX) {
        // Nested — parent is responsible for this node
        next({ inJSX: true });
        return;
      }
      const el = node as unknown as JSXElement;

      if (mode === "ssr") {
        if (isComponentTag(el.openingElement.name)) {
          return buildComponentCall(el, state) as unknown as ESTNode;
        }
        return transformJSXForSSRNode(el, state) as unknown as ESTNode;
      } else {
        if (isComponentTag(el.openingElement.name)) {
          return buildComponentCall(el, state) as unknown as ESTNode;
        }
        return transformJSXNode(el, state) as unknown as ESTNode;
      }
    },
    JSXFragment(
      node: ESTNode,
      { state: walkState, next }: { state: { inJSX: boolean }; next: (s?: { inJSX: boolean }) => void },
    ) {
      if (walkState.inJSX) {
        next({ inJSX: true });
        return;
      }
      const frag = node as unknown as JSXFragment;
      if (mode === "ssr") {
        return transformJSXForSSRNode(frag, state) as unknown as ESTNode;
      }
      return transformJSXNode(frag, state) as unknown as ESTNode;
    },
  }) as unknown as Program;

  // Insert template declarations after imports
  if (state.templates.length > 0) {
    let insertIndex = 0;
    for (let i = 0; i < transformedProgram.body.length; i++) {
      if (transformedProgram.body[i]!.type === "ImportDeclaration") {
        insertIndex = i + 1;
      } else {
        break;
      }
    }
    transformedProgram.body.splice(insertIndex, 0, ...state.templates);
  }

  // Add runtime imports
  addRuntimeImports(transformedProgram, state.runtimeImports, runtimeModule);

  // Generate output using esrap
  const { code: outputCode, map: outputMap } = print(
    transformedProgram as { type: string },
    ts(),
    sourceMap
      ? { sourceMapSource: filename, sourceMapContent: code }
      : undefined,
  );

  return {
    code: outputCode,
    map: sourceMap && outputMap ? JSON.stringify(outputMap) : undefined,
  };
}

export { transform };
export type { TransformOptions, TransformResult };
