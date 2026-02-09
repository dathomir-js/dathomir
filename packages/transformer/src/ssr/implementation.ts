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
 */

import * as t from "@babel/types";

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
 * SSR output generates:
 * - renderToString(tree, state, dynamicValues)
 */
function generateSSRRender(
  tree: t.Expression,
  dynamicValues: t.Expression[],
  stateExpr: t.Expression | null,
): t.Expression {
  // Create dynamic values map
  const mapEntries = dynamicValues.map((value, index) =>
    t.arrayExpression([t.numericLiteral(index + 1), value]),
  );

  const dynamicValuesMap = t.newExpression(t.identifier("Map"), [
    t.arrayExpression(mapEntries),
  ]);

  // Call renderToString(tree, state, dynamicValues)
  return t.callExpression(t.identifier("renderToString"), [
    t.arrayExpression([tree]),
    stateExpr ?? t.objectExpression([]),
    dynamicValuesMap,
  ]);
}

/**
 * Generate state object expression from Signals.
 */
function generateStateObject(signals: Map<string, t.Expression>): t.Expression {
  if (signals.size === 0) {
    return t.objectExpression([]);
  }

  const properties = Array.from(signals.entries()).map(([name, expr]) =>
    t.objectProperty(t.identifier(name), expr),
  );

  return t.objectExpression(properties);
}

export { generateSSRRender, generateStateObject, isSSRImport, SSR_IMPORTS };
export type { SSRImport };
