import { nImport, nImportSpecifier } from "@/transform/ast/implementation";
import type { Program } from "@/transform/ast/implementation";

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

export { addRuntimeImports };
export type { RuntimeImportName };
