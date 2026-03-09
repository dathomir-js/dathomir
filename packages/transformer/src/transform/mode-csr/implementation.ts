import {
  nArrowBlock,
  nBlock,
  nCall,
  nConst,
  nExprStmt,
  nId,
  nLit,
  nMember,
  nReturn,
} from "@/transform/ast/implementation";
import type { ESTNode } from "@/transform/ast/implementation";
import { generateNavigation } from "@/transform/navigation/implementation";
import { createTemplateId } from "@/transform/state/implementation";
import type { TransformState } from "@/transform/state/implementation";
import { jsxToTree } from "@/transform/tree/implementation";
import type { NestedTransformers } from "@/transform/tree/implementation";
import type { JSXElement, JSXFragment } from "@/transform/jsx/implementation";

/**
 * Transform a JSX element/fragment node to CSR DOM code.
 */
function transformJSXNode(
  node: JSXElement | JSXFragment,
  state: TransformState,
  nested: NestedTransformers,
): ESTNode {
  const { tree, dynamicParts } = jsxToTree(node, state, nested);

  const templateId = createTemplateId(state);
  state.runtimeImports.add("fromTree");

  state.templates.push(nConst(templateId, nCall(nId("fromTree"), [tree, nLit(0)])));

  const setupStatements: ESTNode[] = [];
  const fragmentId = nId("_f");
  setupStatements.push(nConst(fragmentId, nCall(templateId, [])));

  const nodeDeclarations: ESTNode[] = [];
  const updateStatements: ESTNode[] = [];
  const declaredNodeIds = new Set<string>();

  function ensureNodeDeclaration(path: number[]): ESTNode {
    const nodeName = `_n${path.join("_")}`;
    const nodeId = nId(nodeName);

    if (!declaredNodeIds.has(nodeName)) {
      declaredNodeIds.add(nodeName);
      nodeDeclarations.push(nConst(nodeId, generateNavigation(fragmentId, path, state)));
    }

    return nodeId;
  }

  for (const part of dynamicParts) {
    const nodeId = ensureNodeDeclaration(part.path);

    switch (part.type) {
      case "text": {
        state.runtimeImports.add("setText");
        state.runtimeImports.add("templateEffect");

        updateStatements.push(
          nExprStmt(
            nCall(nId("templateEffect"), [
              nArrowBlock(
                [],
                nBlock([nExprStmt(nCall(nId("setText"), [nodeId, part.expression]))]),
              ),
            ]),
          ),
        );
        break;
      }

      case "attr": {
        state.runtimeImports.add("setAttr");
        state.runtimeImports.add("templateEffect");

        updateStatements.push(
          nExprStmt(
            nCall(nId("templateEffect"), [
              nArrowBlock(
                [],
                nBlock([
                  nExprStmt(
                    nCall(nId("setAttr"), [nodeId, nLit(part.key ?? ""), part.expression]),
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

        updateStatements.push(
          nExprStmt(nCall(nId("event"), [nLit(part.key ?? ""), nodeId, part.expression])),
        );
        break;
      }

      case "insert": {
        state.runtimeImports.add("insert");

        if (part.isComponent) {
          updateStatements.push(
            nExprStmt(
              nCall(nId("insert"), [
                nMember(nodeId, nId("parentNode")),
                part.expression,
                nodeId,
              ]),
            ),
          );
        } else {
          state.runtimeImports.add("templateEffect");
          updateStatements.push(
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

        updateStatements.push(
          nExprStmt(
            nCall(nId("templateEffect"), [
              nArrowBlock(
                [],
                nBlock([nExprStmt(nCall(nId("spread"), [nodeId, part.expression]))]),
              ),
            ]),
          ),
        );
        break;
      }
    }
  }

  setupStatements.push(...nodeDeclarations);
  setupStatements.push(...updateStatements);
  setupStatements.push(nReturn(fragmentId));
  return nCall(nArrowBlock([], nBlock(setupStatements)), []);
}

export { transformJSXNode };
