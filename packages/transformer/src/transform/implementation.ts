import { parseSync } from "oxc-parser";
import { print } from "esrap";
import ts from "esrap/languages/ts";
import { walk } from "zimmerframe";

import type { ESTNode, Program } from "@/transform/ast/implementation";
import { isComponentTag } from "@/transform/jsx/implementation";
import type { JSXElement, JSXFragment } from "@/transform/jsx/implementation";
import { transformJSXNode } from "@/transform/mode-csr/implementation";
import { transformJSXForSSRNode } from "@/transform/mode-ssr/implementation";
import { addRuntimeImports } from "@/transform/runtimeImports/implementation";
import { createInitialState } from "@/transform/state/implementation";
import { buildComponentCall } from "@/transform/tree/implementation";

import type { TransformOptions, TransformResult } from "../types";

/**
 * Adapt an oxc-parser Program to our internal ESTNode representation.
 *
 * oxc-parser outputs `@oxc-project/types.Program` which is structurally
 * compatible with `ESTNode` at runtime but lacks the index signature
 * `[key: string]: unknown`.  We validate the structural contract and
 * return the same object typed as `ESTNode`.
 */
function adaptParsedProgram(
  program: ReturnType<typeof parseSync>["program"],
): ESTNode {
  if (typeof program !== "object" || program === null || !("type" in program)) {
    throw new TypeError("Expected an ESTree-compatible Program node");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- boundary between oxc-parser types and internal ESTNode
  return program as any;
}

function toPrintableProgram(program: Program): Parameters<typeof print>[0] {
  return program as Parameters<typeof print>[0];
}

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
    adaptParsedProgram(parsed.program),
    { inJSX: false },
    {
      JSXElement(
        node: ESTNode,
        {
          state: walkState,
          next,
        }: {
          state: { inJSX: boolean };
          next: (s?: { inJSX: boolean }) => void;
        },
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
        }: {
          state: { inJSX: boolean };
          next: (s?: { inJSX: boolean }) => void;
        },
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
      const statement = transformedProgram.body[i];
      if (statement?.type === "ImportDeclaration") {
        insertIndex = i + 1;
      } else {
        break;
      }
    }

    transformedProgram.body.splice(insertIndex, 0, ...state.templates);
  }

  addRuntimeImports(transformedProgram, state.runtimeImports, runtimeModule);

  const { code: outputCode, map: outputMap } = print(
    toPrintableProgram(transformedProgram),
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
