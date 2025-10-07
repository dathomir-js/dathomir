import { parse } from "@babel/parser";

/**
 * Parses JSX/TSX code into a Babel AST.
 * @param code - The source code to parse
 * @returns The parsed AST
 */
export const parseToAst = (code: string) => {
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  return ast;
};
