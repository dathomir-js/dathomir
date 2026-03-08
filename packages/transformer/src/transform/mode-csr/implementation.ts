import {
  isVariableDeclaration,
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

  for (const part of dynamicParts) {
    const nodeId = nId(`_n${part.path.join("_")}`);

    switch (part.type) {
      case "text": {
        state.runtimeImports.add("setText");
        state.runtimeImports.add("templateEffect");

        setupStatements.push(nConst(nodeId, generateNavigation(fragmentId, part.path, state)));
        setupStatements.push(
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

        setupStatements.push(nConst(nodeId, generateNavigation(fragmentId, part.path, state)));
        setupStatements.push(
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
        const alreadyDeclared = setupStatements.some(
          (s) => isVariableDeclaration(s) && s.declarations[0]?.id.name === nodeId.name,
        );

        if (!alreadyDeclared) {
          setupStatements.push(nConst(nodeId, generateNavigation(fragmentId, part.path, state)));
        }

        setupStatements.push(
          nExprStmt(nCall(nId("event"), [nLit(part.key ?? ""), nodeId, part.expression])),
        );
        break;
      }

      case "insert": {
        state.runtimeImports.add("insert");

        setupStatements.push(nConst(nodeId, generateNavigation(fragmentId, part.path, state)));

        if (part.isComponent) {
          setupStatements.push(
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
          setupStatements.push(
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

        const alreadyDeclared = setupStatements.some(
          (s) => isVariableDeclaration(s) && s.declarations[0]?.id.name === nodeId.name,
        );

        if (!alreadyDeclared) {
          setupStatements.push(nConst(nodeId, generateNavigation(fragmentId, part.path, state)));
        }

        setupStatements.push(
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

  setupStatements.push(nReturn(fragmentId));
  return nCall(nArrowBlock([], nBlock(setupStatements)), []);
}

export { transformJSXNode };
