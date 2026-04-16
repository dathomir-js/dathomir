import {
  nId,
  type ESTNode,
  type Identifier,
  type VariableDeclaration,
} from "@/transform/ast/implementation";
import type { RuntimeImportName } from "@/transform/runtimeImports/implementation";

interface TransformState {
  templateCount: number;
  clientTargetCount: number;
  clientActionCount: number;
  templates: VariableDeclaration[];
  runtimeImports: Set<RuntimeImportName>;
  mode: "csr" | "ssr";
  moduleBindings: Set<string>;
  componentClientActions: Array<{
    id: string;
    factory: ESTNode;
  }>;
  currentSerializableBindings?: Map<string, ESTNode>;
  currentColocatedClientState?: {
    strategy: "load" | "interaction" | "visible" | "idle" | null;
    interactionEventType: string | null;
  };
  currentElementNamespace?: "html" | "svg" | "math";
  currentHostIslandMetadata?: boolean;
}

/**
 * Build the initial transform state.
 */
function createInitialState(mode: "csr" | "ssr"): TransformState {
  return {
    templateCount: 0,
    clientTargetCount: 0,
    clientActionCount: 0,
    templates: [],
    runtimeImports: new Set(),
    mode,
    moduleBindings: new Set(),
    componentClientActions: [],
    currentElementNamespace: "html",
    currentHostIslandMetadata: false,
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

function createClientActionId(state: TransformState): string {
  state.clientActionCount += 1;
  return `dh-ca-${state.clientActionCount}`;
}

export {
  createClientActionId,
  createClientTargetId,
  createInitialState,
  createTemplateId,
};
export type { TransformState };
