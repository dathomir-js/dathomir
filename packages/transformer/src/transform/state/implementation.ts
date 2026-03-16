import { nId } from "@/transform/ast/implementation";
import type {
  Identifier,
  VariableDeclaration,
} from "@/transform/ast/implementation";
import type { RuntimeImportName } from "@/transform/runtimeImports/implementation";

interface TransformState {
  templateCount: number;
  clientTargetCount: number;
  templates: VariableDeclaration[];
  runtimeImports: Set<RuntimeImportName>;
  mode: "csr" | "ssr";
}

/**
 * Build the initial transform state.
 */
function createInitialState(mode: "csr" | "ssr"): TransformState {
  return {
    templateCount: 0,
    clientTargetCount: 0,
    templates: [],
    runtimeImports: new Set(),
    mode,
  };
}

/**
 * Create a unique template identifier for the current state.
 */
function createTemplateId(state: TransformState): Identifier {
  return nId(`_t${++state.templateCount}`);
}

function createClientTargetId(state: TransformState): string {
  state.clientTargetCount += 1;
  return `dh-ct-${state.clientTargetCount}`;
}

export { createClientTargetId, createInitialState, createTemplateId };
export type { TransformState };
