import generate from "@babel/generator";
import type { GeneratorResult } from "@babel/generator";
import { parseToAst } from "./parseToAst";
import { traverseToReactive } from "./traverseToReactive";

/**
 * Transforms JSX/TSX code by wrapping reactive references with computed().
 * @param input - The source code to transform
 * @returns The generator result containing transformed code and source map
 */
export const transform = (input: string): GeneratorResult => {
  const ast = parseToAst(input);
  traverseToReactive(ast);
  const result = generate(ast, { retainLines: false });

  return result;
};
