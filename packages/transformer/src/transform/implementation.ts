import { parseSync } from "oxc-parser";
import { print } from "esrap";
import ts from "esrap/languages/ts";
import { walk } from "zimmerframe";

import type {
  ESTNode,
  Program,
} from "@/transform/ast/implementation";
import {
  isComponentTag,
} from "@/transform/jsx/implementation";
import type {
  JSXElement,
  JSXFragment,
} from "@/transform/jsx/implementation";
import { transformJSXNode } from "@/transform/mode-csr/implementation";
import { transformJSXForSSRNode } from "@/transform/mode-ssr/implementation";
import { addRuntimeImports } from "@/transform/runtimeImports/implementation";
import { createInitialState } from "@/transform/state/implementation";
import { buildComponentCall } from "@/transform/tree/implementation";

import type { TransformOptions, TransformResult } from "../types";

function isJSXElement(node: ESTNode): node is JSXElement {
  return node.type === "JSXElement";
}

function isJSXFragment(node: ESTNode): node is JSXFragment {
  return node.type === "JSXFragment";
}

/**
 * Transform source code containing JSX.
 */
function transform(
  code: string,
  options: TransformOptions = {},
): TransformResult {
  const {
    mode = "csr",
    sourceMap = false,
    filename = "unknown.tsx",
    runtimeModule = "@dathomir/runtime",
  } = options;

  const parsed = parseSync(filename, code, { sourceType: "module" });
  const state = createInitialState(mode);

  const nested = {
    transformJSXNode,
    transformJSXForSSRNode,
  };

  const transformedProgram = walk(
    parsed.program as unknown as ESTNode,
    { inJSX: false },
    {
      JSXElement(
        node: ESTNode,
        {
          state: walkState,
          next,
        }: { state: { inJSX: boolean }; next: (s?: { inJSX: boolean }) => void },
      ) {
        if (walkState.inJSX) {
          next({ inJSX: true });
          return;
        }

        if (!isJSXElement(node)) return;

        if (isComponentTag(node.openingElement.name)) {
          return buildComponentCall(node, state, nested);
        }

        if (mode === "ssr") {
          return transformJSXForSSRNode(node, state, nested);
        }

        return transformJSXNode(node, state, nested);
      },
      JSXFragment(
        node: ESTNode,
        {
          state: walkState,
          next,
        }: { state: { inJSX: boolean }; next: (s?: { inJSX: boolean }) => void },
      ) {
        if (walkState.inJSX) {
          next({ inJSX: true });
          return;
        }

        if (!isJSXFragment(node)) return;

        if (mode === "ssr") {
          return transformJSXForSSRNode(node, state, nested);
        }

        return transformJSXNode(node, state, nested);
      },
    },
  ) as Program;

  if (state.templates.length > 0) {
    let insertIndex = 0;
    for (let i = 0; i < transformedProgram.body.length; i++) {
      if (transformedProgram.body[i]!.type === "ImportDeclaration") {
        insertIndex = i + 1;
      } else {
        break;
      }
    }

    transformedProgram.body.splice(insertIndex, 0, ...state.templates);
  }

  addRuntimeImports(transformedProgram, state.runtimeImports, runtimeModule);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { code: outputCode, map: outputMap } = print(
    transformedProgram as any,
    ts(),
    sourceMap
      ? { sourceMapSource: filename, sourceMapContent: code }
      : undefined,
  );

  return {
    code: outputCode,
    map: sourceMap && outputMap ? JSON.stringify(outputMap) : undefined,
  };
}

export { transform };
export type { TransformOptions, TransformResult };
