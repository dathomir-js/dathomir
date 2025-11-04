import { generate } from "@babel/generator";
import type { GeneratorResult } from "@babel/generator";
import { parseToAst } from "./parseToAst";
import { traverseToReactive } from "./traverseToReactive";

/**
 * Transforms JavaScript code (already converted from JSX) by wrapping expressions with computed().
 * Processes jsx() function call arguments to wrap object property values.
 * @param input - The source code to transform (post-JSX conversion)
 * @returns The generator result containing transformed code and source map
 */
export const transform = (input: string): GeneratorResult => {
  const ast = parseToAst(input);
  traverseToReactive(ast);
  const result = generate(ast, { retainLines: false, comments: true });

  return result;
};
