import { nArr, nCall, nId, nLit, nNew, nObj } from "@/transform/ast/implementation";
import type { ESTNode } from "@/transform/ast/implementation";
import type { JSXElement, JSXFragment } from "@/transform/jsx/implementation";
import type { TransformState } from "@/transform/state/implementation";
import { jsxToTree } from "@/transform/tree/implementation";
import type { NestedTransformers } from "@/transform/tree/implementation";

/**
 * Transform a JSX element/fragment node to SSR render code.
 */
function transformJSXForSSRNode(
  node: JSXElement | JSXFragment,
  state: TransformState,
  nested: NestedTransformers,
): ESTNode {
  const { tree, dynamicParts } = jsxToTree(node, state, nested);

  state.runtimeImports.add("renderToString");

  const dynamicValueEntries: ESTNode[] = [];

  for (const part of dynamicParts) {
    if (
      part.type === "text" ||
      part.type === "insert" ||
      part.type === "attr" ||
      part.type === "spread"
    ) {
      dynamicValueEntries.push(nArr([nLit(dynamicValueEntries.length + 1), part.expression]));
    }
  }

  const dynamicValuesMap =
    dynamicValueEntries.length > 0
      ? nNew(nId("Map"), [nArr(dynamicValueEntries)])
      : nNew(nId("Map"), [nArr([])]);

  return nCall(nId("renderToString"), [tree, nObj([]), dynamicValuesMap]);
}

export { transformJSXForSSRNode };
