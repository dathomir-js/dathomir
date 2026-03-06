/**
 * SSR code generation utilities for the transformer.
 *
 * Per SPEC.typ:
 * - Generates code that renders to HTML strings with markers
 * - Uses renderToString from @dathomir/runtime
 * - Serializes Signal initial values
 *
 * Note: The main SSR transformation is handled in transform.ts
 * This file contains utility functions for SSR-specific operations.
 *
 * Uses plain ESTree nodes (no @babel/types dependency) to match
 * the approach used in the transform module (see ADR-001 in SPEC.typ).
 */

// ---------------------------------------------------------------------------
// Minimal ESTree node types
// ---------------------------------------------------------------------------

/** A generic ESTree node with a `type` discriminant. */
interface ESTNode {
  type: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// ESTree node builder helpers
// ---------------------------------------------------------------------------

/** Build a Literal node. */
function nLit(value: string | number | boolean | null): ESTNode {
  if (value === null) return { type: "Literal", value: null, raw: "null" };
  if (typeof value === "string")
    return { type: "Literal", value, raw: JSON.stringify(value) };
  return { type: "Literal", value, raw: String(value) };
}

/** Build an Identifier node. */
function nId(name: string): ESTNode {
  return { type: "Identifier", name };
}

/** Build a CallExpression node. */
function nCall(callee: ESTNode, args: ESTNode[]): ESTNode {
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

/** Build a Property node (ESTree object property). */
function nProp(key: ESTNode, value: ESTNode): ESTNode {
  return {
    type: "Property",
    key,
    value,
    kind: "init",
    computed: false,
    method: false,
    shorthand: false,
  };
}

/** Build a NewExpression node. */
function nNew(callee: ESTNode, args: ESTNode[]): ESTNode {
  return { type: "NewExpression", callee, arguments: args };
}

// ---------------------------------------------------------------------------
// SSR utilities
// ---------------------------------------------------------------------------

/**
 * Runtime imports specific to SSR.
 */
const SSR_IMPORTS = [
  "renderToString",
  "renderTree",
  "serializeState",
  "createMarker",
  "MarkerType",
] as const;

type SSRImport = (typeof SSR_IMPORTS)[number];

/**
 * Check if an import is an SSR-specific import.
 */
function isSSRImport(name: string): name is SSRImport {
  return SSR_IMPORTS.includes(name as SSRImport);
}

/**
 * Generate SSR render code for a tree.
 *
 * Produces: renderToString([tree], state, new Map([[1, v1], [2, v2], ...]))
 */
function generateSSRRender(
  tree: ESTNode,
  dynamicValues: ESTNode[],
  stateExpr: ESTNode | null,
): ESTNode {
  // Build indexed map entries: [[1, val1], [2, val2], ...]
  const mapEntries = dynamicValues.map((value, index) =>
    nArr([nLit(index + 1), value]),
  );

  const dynamicValuesMap = nNew(nId("Map"), [nArr(mapEntries)]);

  // renderToString([tree], state, dynamicValuesMap)
  return nCall(nId("renderToString"), [
    nArr([tree]),
    stateExpr ?? nObj([]),
    dynamicValuesMap,
  ]);
}

/**
 * Generate state object expression from Signals.
 */
function generateStateObject(signals: Map<string, ESTNode>): ESTNode {
  if (signals.size === 0) {
    return nObj([]);
  }

  const properties = Array.from(signals.entries()).map(([name, expr]) =>
    nProp(nId(name), expr),
  );

  return nObj(properties);
}

export { generateSSRRender, generateStateObject, isSSRImport, SSR_IMPORTS };
export type { SSRImport };
