import { parse } from "@babel/parser";

/**
 * Parses JavaScript/TypeScript code into a Babel AST.
 * Expects code that has already been transformed from JSX to JS.
 * @param code - The source code to parse
 * @returns The parsed AST
 */
export const parseToAst = (code: string) => {
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript"],
  });

  return ast;
};
