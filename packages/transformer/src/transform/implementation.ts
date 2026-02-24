import generateDefault from "@babel/generator";
import { parse, type ParserOptions } from "@babel/parser";
import traverseDefault, { type NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type { TransformOptions, TransformResult } from "../types";

// Handle CJS/ESM interop
const traverse =
  typeof traverseDefault === "function"
    ? traverseDefault
    : (traverseDefault as any).default;
const generate =
  typeof generateDefault === "function"
    ? generateDefault
    : (generateDefault as any).default;

/**
 * Runtime import identifiers (CSR).
 */
interface CSRRuntimeImports {
  fromTree: t.Identifier;
  firstChild: t.Identifier;
  nextSibling: t.Identifier;
  setText: t.Identifier;
  setAttr: t.Identifier;
  setProp: t.Identifier;
  spread: t.Identifier;
  event: t.Identifier;
  templateEffect: t.Identifier;
  createRoot: t.Identifier;
  reconcile: t.Identifier;
  insert: t.Identifier;
}

/**
 * Runtime import identifiers (SSR).
 */
interface SSRRuntimeImports {
  renderToString: t.Identifier;
  renderTree: t.Identifier;
  serializeState: t.Identifier;
  createMarker: t.Identifier;
  MarkerType: t.Identifier;
}

/**
 * Combined runtime imports.
 */
type RuntimeImports = CSRRuntimeImports & SSRRuntimeImports;

/**
 * State for tracking template generation.
 */
interface TransformState {
  templateCount: number;
  templates: t.VariableDeclaration[];
  runtimeImports: Set<keyof RuntimeImports>;
  mode: "csr" | "ssr";
}

/**
 * Create a unique template identifier.
 */
function createTemplateId(state: TransformState): t.Identifier {
  return t.identifier(`_t${++state.templateCount}`);
}

/**
 * Check if a node contains reactive access (.value).
 */
function containsReactiveAccess(node: t.Node): boolean {
  if (t.isMemberExpression(node)) {
    if (t.isIdentifier(node.property) && node.property.name === "value") {
      return true;
    }
  }

  let found = false;
  traverse(t.file(t.program([t.expressionStatement(node as t.Expression)])), {
    MemberExpression(path: NodePath<t.MemberExpression>) {
      if (
        t.isIdentifier(path.node.property) &&
        path.node.property.name === "value"
      ) {
        found = true;
        path.stop();
      }
    },
    noScope: true,
  });

  return found;
}

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

/**
 * Check if a JSX element name represents a component (starts with uppercase).
 * Per JSX convention: uppercase = component, lowercase = HTML element.
 * JSXMemberExpression (e.g. Foo.Bar) is always a component.
 */
function isComponentTag(
  name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName,
): boolean {
  if (t.isJSXIdentifier(name)) {
    return /^[A-Z]/.test(name.name);
  }
  if (t.isJSXMemberExpression(name)) {
    return true;
  }
  return false;
}

/**
 * Convert a JSX element name to a JavaScript expression for function call.
 * e.g. Counter → Identifier("Counter"), Foo.Bar → MemberExpression(Foo, Bar)
 */
function jsxNameToExpression(
  name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName,
): t.Expression {
  if (t.isJSXIdentifier(name)) {
    return t.identifier(name.name);
  }
  if (t.isJSXMemberExpression(name)) {
    return t.memberExpression(
      jsxNameToExpression(name.object),
      t.identifier(name.property.name),
    );
  }
  return t.identifier(`${name.namespace.name}_${name.name.name}`);
}

/**
 * Build a component function call expression from a JSX element.
 * Converts <Counter initialCount={5} /> into Counter({ initialCount: 5 }).
 * Children are passed as the `children` prop.
 */
function buildComponentCall(
  node: t.JSXElement,
  state: TransformState,
): t.Expression {
  const opening = node.openingElement;
  const componentRef = jsxNameToExpression(opening.name);

  // Build props object from attributes
  const propsProperties: (t.ObjectProperty | t.SpreadElement)[] = [];

  for (const attr of opening.attributes) {
    if (t.isJSXSpreadAttribute(attr)) {
      propsProperties.push(t.spreadElement(attr.argument));
      continue;
    }
    if (!t.isJSXIdentifier(attr.name)) continue;

    const key = attr.name.name;
    let value: t.Expression;

    if (attr.value === null) {
      value = t.booleanLiteral(true);
    } else if (t.isStringLiteral(attr.value)) {
      value = attr.value;
    } else if (t.isJSXExpressionContainer(attr.value)) {
      if (t.isJSXEmptyExpression(attr.value.expression)) continue;
      value = attr.value.expression;
    } else {
      continue;
    }

    propsProperties.push(t.objectProperty(t.identifier(key), value));
  }

  // Handle children
  const significantChildren = node.children.filter((c) => {
    if (t.isJSXText(c)) return c.value.trim() !== "";
    if (t.isJSXExpressionContainer(c))
      return !t.isJSXEmptyExpression(c.expression);
    return true;
  });

  if (significantChildren.length > 0) {
    const childExprs: t.Expression[] = [];
    for (const child of significantChildren) {
      if (t.isJSXText(child)) {
        childExprs.push(t.stringLiteral(child.value.trim()));
      } else if (t.isJSXExpressionContainer(child)) {
        if (!t.isJSXEmptyExpression(child.expression)) {
          childExprs.push(child.expression);
        }
      } else if (t.isJSXElement(child)) {
        if (isComponentTag(child.openingElement.name)) {
          childExprs.push(buildComponentCall(child, state));
        } else {
          // HTML element child of component - transform through pipeline
          childExprs.push(
            state.mode === "ssr"
              ? transformJSXForSSRNode(child, state)
              : transformJSXNode(child, state),
          );
        }
      } else if (t.isJSXFragment(child)) {
        // Fragment children - process each
        for (const fragChild of child.children) {
          if (t.isJSXText(fragChild)) {
            const text = fragChild.value.trim();
            if (text) childExprs.push(t.stringLiteral(text));
          } else if (t.isJSXExpressionContainer(fragChild)) {
            if (!t.isJSXEmptyExpression(fragChild.expression)) {
              childExprs.push(fragChild.expression);
            }
          } else if (t.isJSXElement(fragChild)) {
            if (isComponentTag(fragChild.openingElement.name)) {
              childExprs.push(buildComponentCall(fragChild, state));
            } else {
              childExprs.push(
                state.mode === "ssr"
                  ? transformJSXForSSRNode(fragChild, state)
                  : transformJSXNode(fragChild, state),
              );
            }
          }
        }
      }
    }

    if (childExprs.length === 1) {
      propsProperties.push(
        t.objectProperty(t.identifier("children"), childExprs[0]!),
      );
    } else if (childExprs.length > 1) {
      propsProperties.push(
        t.objectProperty(
          t.identifier("children"),
          t.arrayExpression(childExprs),
        ),
      );
    }
  }

  const propsArg = t.objectExpression(propsProperties);
  return t.callExpression(componentRef, [propsArg]);
}

/**
 * Convert JSX element to structured array tree.
 */
function jsxToTree(
  node: t.JSXElement | t.JSXFragment,
  state: TransformState,
): { tree: t.Expression; dynamicParts: DynamicPart[] } {
  const dynamicParts: DynamicPart[] = [];

  if (t.isJSXFragment(node)) {
    const children = processChildren(node.children, state, dynamicParts, []);
    return {
      tree: t.arrayExpression(children.map((c) => c.tree)),
      dynamicParts: children.flatMap((c) => c.dynamicParts),
    };
  }

  const result = jsxElementToTree(node, state, dynamicParts, [0]);
  return { tree: t.arrayExpression([result.tree]), dynamicParts };
}

interface TreeResult {
  tree: t.Expression;
  dynamicParts: DynamicPart[];
}

interface DynamicPart {
  type: "text" | "attr" | "event" | "spread" | "insert";
  path: number[];
  expression: t.Expression;
  key?: string;
}

/**
 * Convert JSX element to tree node.
 */
function jsxElementToTree(
  node: t.JSXElement,
  state: TransformState,
  dynamicParts: DynamicPart[],
  path: number[],
): TreeResult {
  const opening = node.openingElement;
  const tagName = getTagName(opening.name);

  // Process attributes
  const { attrs, events, spreads } = processAttributes(
    opening.attributes,
    state,
    dynamicParts,
    path,
  );

  // Process children
  const children = processChildren(node.children, state, dynamicParts, path);

  // Build tree node: [tagName, attrs, ...children]
  const treeElements: t.Expression[] = [
    t.stringLiteral(tagName),
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
    tree: t.arrayExpression(treeElements),
    dynamicParts: children.flatMap((c) => c.dynamicParts),
  };
}

/**
 * Get tag name from JSX name.
 */
function getTagName(
  name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName,
): string {
  if (t.isJSXIdentifier(name)) {
    return name.name;
  }
  if (t.isJSXMemberExpression(name)) {
    return getTagName(name.object) + "." + name.property.name;
  }
  return name.namespace.name + ":" + name.name.name;
}

interface ProcessedAttributes {
  attrs: t.ObjectExpression | t.NullLiteral;
  events: { type: string; handler: t.Expression }[];
  spreads: t.Expression[];
}

/**
 * Process JSX attributes.
 */
function processAttributes(
  attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[],
  _state: TransformState,
  dynamicParts: DynamicPart[],
  path: number[],
): ProcessedAttributes {
  const staticProps: t.ObjectProperty[] = [];
  const events: { type: string; handler: t.Expression }[] = [];
  const spreads: t.Expression[] = [];

  for (const attr of attributes) {
    if (t.isJSXSpreadAttribute(attr)) {
      spreads.push(attr.argument);
      continue;
    }

    const name = attr.name;
    if (!t.isJSXIdentifier(name)) continue;

    const key = name.name;
    const value = attr.value;

    if (value === null) {
      // Boolean attribute: <button disabled />
      staticProps.push(
        t.objectProperty(t.identifier(key), t.booleanLiteral(true)),
      );
      continue;
    }

    if (t.isStringLiteral(value)) {
      // Static string attribute
      staticProps.push(t.objectProperty(t.identifier(key), value));
      continue;
    }

    if (t.isJSXExpressionContainer(value)) {
      const expr = value.expression;
      if (t.isJSXEmptyExpression(expr)) continue;

      if (isEventHandlerKey(key)) {
        // Event handler
        events.push({ type: getEventType(key), handler: expr });
      } else if (containsReactiveAccess(expr)) {
        // Dynamic attribute with reactive access
        dynamicParts.push({
          type: "attr",
          path,
          expression: expr,
          key,
        });
      } else {
        // Static expression attribute
        staticProps.push(t.objectProperty(t.identifier(key), expr));
      }
    }
  }

  return {
    attrs:
      staticProps.length > 0
        ? t.objectExpression(staticProps)
        : t.nullLiteral(),
    events,
    spreads,
  };
}

/**
 * Process JSX children.
 */
function processChildren(
  children: (
    | t.JSXElement
    | t.JSXFragment
    | t.JSXText
    | t.JSXExpressionContainer
    | t.JSXSpreadChild
  )[],
  state: TransformState,
  dynamicParts: DynamicPart[],
  parentPath: number[],
): TreeResult[] {
  const results: TreeResult[] = [];
  let childIndex = 0;

  for (const child of children) {
    if (t.isJSXText(child)) {
      // Skip whitespace-only text
      const text = child.value.trim();
      if (text) {
        results.push({
          tree: t.stringLiteral(text),
          dynamicParts: [],
        });
        childIndex++;
      }
      continue;
    }

    if (t.isJSXElement(child)) {
      // Component elements (uppercase tag) → function call + insert placeholder
      if (isComponentTag(child.openingElement.name)) {
        const callExpr = buildComponentCall(child, state);
        dynamicParts.push({
          type: "insert",
          path: [...parentPath, childIndex],
          expression: callExpr,
        });
        results.push({
          tree: t.arrayExpression([
            t.stringLiteral("{insert}"),
            t.nullLiteral(),
          ]),
          dynamicParts: [],
        });
        childIndex++;
        continue;
      }
      // HTML elements → tree node
      const childPath = [...parentPath, childIndex];
      results.push(jsxElementToTree(child, state, dynamicParts, childPath));
      childIndex++;
      continue;
    }

    if (t.isJSXFragment(child)) {
      const processed = processChildren(
        child.children,
        state,
        dynamicParts,
        parentPath,
      );
      results.push(...processed);
      childIndex += processed.length;
      continue;
    }

    if (t.isJSXExpressionContainer(child)) {
      const expr = child.expression;
      if (t.isJSXEmptyExpression(expr)) continue;

      // Check if it's an array (map for lists)
      if (t.isCallExpression(expr) && t.isMemberExpression(expr.callee)) {
        const method = expr.callee.property;
        if (t.isIdentifier(method) && method.name === "map") {
          // This is a list: {items.map(...)}
          dynamicParts.push({
            type: "insert",
            path: [...parentPath, childIndex],
            expression: expr,
          });
          results.push({
            tree: t.arrayExpression([
              t.stringLiteral("{each}"),
              t.nullLiteral(),
            ]),
            dynamicParts: [],
          });
          childIndex++;
          continue;
        }
      }

      // Check if it's a function call (component): {Counter(5)}
      if (t.isCallExpression(expr)) {
        // Function call - treat as insert (component or computed value)
        dynamicParts.push({
          type: "insert",
          path: [...parentPath, childIndex],
          expression: expr,
        });
        results.push({
          tree: t.arrayExpression([
            t.stringLiteral("{insert}"),
            t.nullLiteral(),
          ]),
          dynamicParts: [],
        });
        childIndex++;
        continue;
      }

      // Check if it's a conditional expression (ternary): {condition ? <A/> : <B/>}
      if (t.isConditionalExpression(expr)) {
        // Conditional expression - treat as insert
        dynamicParts.push({
          type: "insert",
          path: [...parentPath, childIndex],
          expression: expr,
        });
        results.push({
          tree: t.arrayExpression([
            t.stringLiteral("{insert}"),
            t.nullLiteral(),
          ]),
          dynamicParts: [],
        });
        childIndex++;
        continue;
      }

      // Dynamic text content
      const childPath = [...parentPath, childIndex];
      dynamicParts.push({
        type: "text",
        path: childPath,
        expression: expr,
      });
      results.push({
        tree: t.arrayExpression([t.stringLiteral("{text}"), t.nullLiteral()]),
        dynamicParts: [],
      });
      childIndex++;
    }
  }

  return results;
}

/**
 * Generate navigation code to reach a node at a given path.
 */
function generateNavigation(
  fragmentId: t.Identifier,
  path: number[],
  state: TransformState,
): t.Expression {
  state.runtimeImports.add("firstChild");

  let expr: t.Expression = t.callExpression(t.identifier("firstChild"), [
    fragmentId,
  ]);

  for (let i = 0; i < path.length; i++) {
    const index = path[i];

    // Navigate to child index
    if (i === 0 && index === 0) {
      // Already at first child
    } else if (i === 0) {
      // Navigate to nth sibling
      for (let j = 0; j < index; j++) {
        state.runtimeImports.add("nextSibling");
        expr = t.callExpression(t.identifier("nextSibling"), [expr]);
      }
    } else {
      // Navigate into children
      expr = t.callExpression(t.identifier("firstChild"), [expr]);
      for (let j = 0; j < index; j++) {
        state.runtimeImports.add("nextSibling");
        expr = t.callExpression(t.identifier("nextSibling"), [expr]);
      }
    }
  }

  return expr;
}

/**
 * Transform a JSX call expression.
 */
function transformJSX(
  path: NodePath<t.JSXElement | t.JSXFragment>,
  state: TransformState,
): t.Expression {
  return transformJSXNode(path.node, state);
}

/**
 * Transform a JSX element/fragment node to CSR DOM code.
 * Core implementation used by both path-based and node-based entry points.
 */
function transformJSXNode(
  node: t.JSXElement | t.JSXFragment,
  state: TransformState,
): t.Expression {
  const { tree, dynamicParts } = jsxToTree(node, state);

  // Create template factory
  const templateId = createTemplateId(state);
  state.runtimeImports.add("fromTree");

  const templateDecl = t.variableDeclaration("const", [
    t.variableDeclarator(
      templateId,
      t.callExpression(t.identifier("fromTree"), [tree, t.numericLiteral(0)]),
    ),
  ]);
  state.templates.push(templateDecl);

  // Generate setup code
  const setupStatements: t.Statement[] = [];

  // Fragment variable
  const fragmentId = t.identifier("_f");
  setupStatements.push(
    t.variableDeclaration("const", [
      t.variableDeclarator(fragmentId, t.callExpression(templateId, [])),
    ]),
  );

  // Process dynamic parts
  for (const part of dynamicParts) {
    const nodeId = t.identifier(`_n${part.path.join("_")}`);

    switch (part.type) {
      case "text": {
        state.runtimeImports.add("setText");
        state.runtimeImports.add("templateEffect");
        state.runtimeImports.add("firstChild");

        // Get text node reference
        setupStatements.push(
          t.variableDeclaration("const", [
            t.variableDeclarator(
              nodeId,
              generateNavigation(fragmentId, part.path, state),
            ),
          ]),
        );

        // Template effect for text update
        setupStatements.push(
          t.expressionStatement(
            t.callExpression(t.identifier("templateEffect"), [
              t.arrowFunctionExpression(
                [],
                t.callExpression(t.identifier("setText"), [
                  nodeId,
                  part.expression,
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

        // Get element reference
        setupStatements.push(
          t.variableDeclaration("const", [
            t.variableDeclarator(
              nodeId,
              generateNavigation(fragmentId, part.path, state),
            ),
          ]),
        );

        // Template effect for attribute update
        setupStatements.push(
          t.expressionStatement(
            t.callExpression(t.identifier("templateEffect"), [
              t.arrowFunctionExpression(
                [],
                t.callExpression(t.identifier("setAttr"), [
                  nodeId,
                  t.stringLiteral(part.key!),
                  part.expression,
                ]),
              ),
            ]),
          ),
        );
        break;
      }

      case "event": {
        state.runtimeImports.add("event");

        // Get element reference (may already exist)
        const existingDecl = setupStatements.find(
          (s) =>
            t.isVariableDeclaration(s) &&
            s.declarations.length > 0 &&
            t.isIdentifier((s.declarations[0] as t.VariableDeclarator).id, {
              name: nodeId.name,
            }),
        );

        if (!existingDecl) {
          setupStatements.push(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                nodeId,
                generateNavigation(fragmentId, part.path, state),
              ),
            ]),
          );
        }

        // Add event listener
        setupStatements.push(
          t.expressionStatement(
            t.callExpression(t.identifier("event"), [
              t.stringLiteral(part.key!),
              nodeId,
              part.expression,
            ]),
          ),
        );
        break;
      }

      case "insert": {
        state.runtimeImports.add("insert");
        state.runtimeImports.add("templateEffect");
        state.runtimeImports.add("firstChild");

        // Get insert point reference (comment node - placeholder)
        setupStatements.push(
          t.variableDeclaration("const", [
            t.variableDeclarator(
              nodeId,
              generateNavigation(fragmentId, part.path, state),
            ),
          ]),
        );

        // Wrap insert in templateEffect for reactivity
        // templateEffect(() => insert(placeholder.parentNode, content, placeholder))
        setupStatements.push(
          t.expressionStatement(
            t.callExpression(t.identifier("templateEffect"), [
              t.arrowFunctionExpression(
                [],
                t.callExpression(t.identifier("insert"), [
                  t.memberExpression(nodeId, t.identifier("parentNode")),
                  part.expression,
                  nodeId,
                ]),
              ),
            ]),
          ),
        );
        break;
      }

      case "spread": {
        state.runtimeImports.add("spread");
        state.runtimeImports.add("templateEffect");

        // Get element reference (may already exist from another part at same path)
        const existingSpreadDecl = setupStatements.find(
          (s) =>
            t.isVariableDeclaration(s) &&
            s.declarations.length > 0 &&
            t.isIdentifier((s.declarations[0] as t.VariableDeclarator).id, {
              name: nodeId.name,
            }),
        );

        if (!existingSpreadDecl) {
          setupStatements.push(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                nodeId,
                generateNavigation(fragmentId, part.path, state),
              ),
            ]),
          );
        }

        // spread(element, spreadObject) applies all properties reactively
        setupStatements.push(
          t.expressionStatement(
            t.callExpression(t.identifier("templateEffect"), [
              t.arrowFunctionExpression(
                [],
                t.callExpression(t.identifier("spread"), [
                  nodeId,
                  part.expression,
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
  setupStatements.push(t.returnStatement(fragmentId));

  // Wrap in IIFE for now (will be optimized later)
  return t.callExpression(
    t.arrowFunctionExpression([], t.blockStatement(setupStatements)),
    [],
  );
}

/**
 * Transform JSX for SSR mode.
 * Generates code that renders to HTML string with markers.
 */
function transformJSXForSSR(
  path: NodePath<t.JSXElement | t.JSXFragment>,
  state: TransformState,
): t.Expression {
  return transformJSXForSSRNode(path.node, state);
}

/**
 * Transform a JSX element/fragment node to SSR render code.
 * Core implementation used by both path-based and node-based entry points.
 */
function transformJSXForSSRNode(
  node: t.JSXElement | t.JSXFragment,
  state: TransformState,
): t.Expression {
  const { tree, dynamicParts } = jsxToTree(node, state);

  // Add SSR imports
  state.runtimeImports.add("renderToString");

  // Collect dynamic values for SSR
  const dynamicValueEntries: t.Expression[] = [];

  for (const part of dynamicParts) {
    if (part.type === "text") {
      // For text, just push the expression value
      dynamicValueEntries.push(
        t.arrayExpression([
          t.numericLiteral(dynamicValueEntries.length + 1),
          part.expression,
        ]),
      );
    } else if (part.type === "insert") {
      // For inserts (like .map results), evaluate and pass
      dynamicValueEntries.push(
        t.arrayExpression([
          t.numericLiteral(dynamicValueEntries.length + 1),
          part.expression,
        ]),
      );
    } else if (part.type === "attr") {
      // For dynamic attributes, pass the expression value for SSR serialization
      dynamicValueEntries.push(
        t.arrayExpression([
          t.numericLiteral(dynamicValueEntries.length + 1),
          part.expression,
        ]),
      );
    } else if (part.type === "event") {
      // Event handlers are not rendered in SSR HTML output; skip them
    } else if (part.type === "spread") {
      // Spread attributes - pass the object for SSR serialization
      dynamicValueEntries.push(
        t.arrayExpression([
          t.numericLiteral(dynamicValueEntries.length + 1),
          part.expression,
        ]),
      );
    }
  }

  // Create Map for dynamic values
  const dynamicValuesMap =
    dynamicValueEntries.length > 0
      ? t.newExpression(t.identifier("Map"), [
          t.arrayExpression(dynamicValueEntries),
        ])
      : t.newExpression(t.identifier("Map"), []);

  // Generate: renderToString(tree, {}, dynamicValuesMap)
  // Note: tree is already an ArrayExpression, no need to wrap again
  return t.callExpression(t.identifier("renderToString"), [
    tree,
    t.objectExpression([]), // state object (signals initialized later)
    dynamicValuesMap,
  ]);
}

/**
 * Add runtime imports to the program.
 */
function addRuntimeImports(
  program: t.Program,
  imports: Set<keyof RuntimeImports>,
  runtimeModule: string,
): void {
  if (imports.size === 0) return;

  const specifiers = Array.from(imports).map((name) =>
    t.importSpecifier(t.identifier(name), t.identifier(name)),
  );

  const importDecl = t.importDeclaration(
    specifiers,
    t.stringLiteral(runtimeModule),
  );

  // Insert at the beginning after any existing imports
  let insertIndex = 0;
  for (let i = 0; i < program.body.length; i++) {
    if (t.isImportDeclaration(program.body[i])) {
      insertIndex = i + 1;
    } else {
      break;
    }
  }

  program.body.splice(insertIndex, 0, importDecl);
}

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

  const parserOptions: ParserOptions = {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  };

  const ast = parse(code, parserOptions);

  const state: TransformState = {
    templateCount: 0,
    templates: [],
    runtimeImports: new Set(),
    mode,
  };

  // Transform JSX expressions based on mode
  if (mode === "ssr") {
    // SSR mode: generate renderToString calls
    traverse(ast, {
      JSXElement(path: NodePath<t.JSXElement>) {
        if (
          path.findParent(
            (p: NodePath) => p.isJSXElement() || p.isJSXFragment(),
          )
        ) {
          return;
        }
        // Root-level component element → function call (no renderToString)
        if (isComponentTag(path.node.openingElement.name)) {
          path.replaceWith(buildComponentCall(path.node, state));
          return;
        }
        const replacement = transformJSXForSSR(path, state);
        path.replaceWith(replacement);
      },
      JSXFragment(path: NodePath<t.JSXFragment>) {
        if (
          path.findParent(
            (p: NodePath) => p.isJSXElement() || p.isJSXFragment(),
          )
        ) {
          return;
        }
        const replacement = transformJSXForSSR(path, state);
        path.replaceWith(replacement);
      },
    });
  } else {
    // CSR mode: generate DOM manipulation code
    traverse(ast, {
      JSXElement(path: NodePath<t.JSXElement>) {
        if (
          path.findParent(
            (p: NodePath) => p.isJSXElement() || p.isJSXFragment(),
          )
        ) {
          return;
        }
        // Root-level component element → function call (no fromTree)
        if (isComponentTag(path.node.openingElement.name)) {
          path.replaceWith(buildComponentCall(path.node, state));
          return;
        }
        const replacement = transformJSX(path, state);
        path.replaceWith(replacement);
      },
      JSXFragment(path: NodePath<t.JSXFragment>) {
        if (
          path.findParent(
            (p: NodePath) => p.isJSXElement() || p.isJSXFragment(),
          )
        ) {
          return;
        }
        const replacement = transformJSX(path, state);
        path.replaceWith(replacement);
      },
    });
  }

  // Insert template declarations at the top of the module
  if (state.templates.length > 0) {
    const program = ast.program;
    let insertIndex = 0;

    // Find position after imports
    for (let i = 0; i < program.body.length; i++) {
      if (t.isImportDeclaration(program.body[i])) {
        insertIndex = i + 1;
      } else {
        break;
      }
    }

    // Insert templates
    program.body.splice(insertIndex, 0, ...state.templates);
  }

  // Add runtime imports
  addRuntimeImports(ast.program, state.runtimeImports, runtimeModule);

  // Generate output
  const output = generate(ast, {
    sourceMaps: sourceMap,
    sourceFileName: filename,
  });

  return {
    code: output.code,
    map: sourceMap && output.map ? JSON.stringify(output.map) : undefined,
  };
}

export { transform };
export type { TransformOptions, TransformResult };
