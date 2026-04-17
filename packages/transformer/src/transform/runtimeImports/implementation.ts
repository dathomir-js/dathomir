import {
  nImport,
  nImportSpecifier,
  type Program,
} from "@/transform/ast/implementation";

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
  | "renderDynamicAttr"
  | "renderDynamicEach"
  | "renderDynamicInsert"
  | "renderDynamicSpread"
  | "renderDynamicText"
  | "serializeState"
  | "registerClientAction"
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
    const statement = program.body[i];
    if (statement.type === "ImportDeclaration") {
      insertIndex = i + 1;
    } else {
      break;
    }
  }

  program.body.splice(insertIndex, 0, importDecl);
}

export { addRuntimeImports };
export type { RuntimeImportName };
