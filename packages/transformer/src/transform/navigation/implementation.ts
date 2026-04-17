import {
  nCall,
  nId,
  type ESTNode,
  type Identifier,
} from "@/transform/ast/implementation";
import type { TransformState } from "@/transform/state/implementation";

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
    const index = path[i];

    if (i === 0 && index === 0) {
      continue;
    }

    if (i === 0) {
      for (let j = 0; j < index; j++) {
        state.runtimeImports.add("nextSibling");
        expr = nCall(nId("nextSibling"), [expr]);
      }
      continue;
    }

    expr = nCall(nId("firstChild"), [expr]);
    for (let j = 0; j < index; j++) {
      state.runtimeImports.add("nextSibling");
      expr = nCall(nId("nextSibling"), [expr]);
    }
  }

  return expr;
}

export { generateNavigation };
