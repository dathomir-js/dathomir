/** A generic ESTree node with a `type` discriminant. */
interface ESTNode {
  type: string;
  [key: string]: unknown;
}

/** ESTree Literal (string, number, boolean, null). */
interface Literal extends ESTNode {
  type: "Literal";
  value: string | number | boolean | null;
  raw: string;
}

/** ESTree Identifier. */
interface Identifier extends ESTNode {
  type: "Identifier";
  name: string;
}

/** ESTree CallExpression. */
interface CallExpression extends ESTNode {
  type: "CallExpression";
  callee: ESTNode;
  arguments: ESTNode[];
  optional: boolean;
}

/** ESTree MemberExpression. */
interface MemberExpression extends ESTNode {
  type: "MemberExpression";
  object: ESTNode;
  property: ESTNode;
  computed: boolean;
  optional: boolean;
}

/** ESTree ArrowFunctionExpression. */
interface ArrowFunctionExpression extends ESTNode {
  type: "ArrowFunctionExpression";
  params: ESTNode[];
  body: ESTNode;
  expression: boolean;
}

/** ESTree BlockStatement. */
interface BlockStatement extends ESTNode {
  type: "BlockStatement";
  body: ESTNode[];
}

/** ESTree VariableDeclarator. */
interface VariableDeclarator extends ESTNode {
  type: "VariableDeclarator";
  id: Identifier;
  init: ESTNode | null;
}

/** ESTree VariableDeclaration. */
interface VariableDeclaration extends ESTNode {
  type: "VariableDeclaration";
  kind: "const" | "let" | "var";
  declarations: VariableDeclarator[];
}

/** ESTree ReturnStatement. */
interface ReturnStatement extends ESTNode {
  type: "ReturnStatement";
  argument: ESTNode | null;
}

/** ESTree Program. */
interface Program extends ESTNode {
  type: "Program";
  body: ESTNode[];
}

/** Build a Literal node. */
function nLit(value: string | number | boolean | null): Literal {
  if (value === null) return { type: "Literal", value: null, raw: "null" };
  if (typeof value === "string") {
    return { type: "Literal", value, raw: JSON.stringify(value) };
  }
  return { type: "Literal", value, raw: String(value) };
}

/** Build an Identifier node. */
function nId(name: string): Identifier {
  return { type: "Identifier", name };
}

/** Build a CallExpression node. */
function nCall(callee: ESTNode, args: ESTNode[]): CallExpression {
  return { type: "CallExpression", callee, arguments: args, optional: false };
}

/** Build an ArrayExpression node. */
function nArr(elements: (ESTNode | null)[]): ESTNode {
  return { type: "ArrayExpression", elements };
}

/** Build an ObjectExpression node. */
function nObj(properties: ESTNode[]): ESTNode {
  return { type: "ObjectExpression", properties };
}

/**
 * Build a Property node (ESTree object property).
 * @param key The key node (Identifier or Literal).
 * @param value The value node.
 * @param computed Whether the key is a computed expression.
 */
function nProp(key: ESTNode, value: ESTNode, computed = false): ESTNode {
  return {
    type: "Property",
    key,
    value,
    kind: "init",
    computed,
    method: false,
    shorthand: false,
  };
}

/** Build an ArrowFunctionExpression with block body. */
function nArrowBlock(
  params: ESTNode[],
  body: BlockStatement,
): ArrowFunctionExpression {
  return {
    type: "ArrowFunctionExpression",
    params,
    body,
    expression: false,
  };
}

/** Build a BlockStatement. */
function nBlock(stmts: ESTNode[]): BlockStatement {
  return { type: "BlockStatement", body: stmts };
}

/** Build a const VariableDeclaration. */
function nConst(id: Identifier, init: ESTNode): VariableDeclaration {
  return {
    type: "VariableDeclaration",
    kind: "const",
    declarations: [{ type: "VariableDeclarator", id, init }],
  };
}

/** Build an ExpressionStatement. */
function nExprStmt(expr: ESTNode): ESTNode {
  return { type: "ExpressionStatement", expression: expr };
}

/** Build a ReturnStatement. */
function nReturn(arg: ESTNode): ReturnStatement {
  return { type: "ReturnStatement", argument: arg };
}

/** Build a SpreadElement (for array spread / function spread). */
function nSpread(arg: ESTNode): ESTNode {
  return { type: "SpreadElement", argument: arg };
}

/** Build a MemberExpression. */
function nMember(
  object: ESTNode,
  property: ESTNode,
  computed = false,
): MemberExpression {
  return {
    type: "MemberExpression",
    object,
    property,
    computed,
    optional: false,
  };
}

/** Build a NewExpression. */
function nNew(callee: ESTNode, args: ESTNode[]): ESTNode {
  return { type: "NewExpression", callee, arguments: args };
}

/** Build an ImportDeclaration. */
function nImport(specifiers: ESTNode[], source: string): ESTNode {
  return {
    type: "ImportDeclaration",
    specifiers,
    source: nLit(source),
    importKind: "value",
  };
}

/** Build an ImportSpecifier (named import). */
function nImportSpecifier(name: string): ESTNode {
  return {
    type: "ImportSpecifier",
    imported: nId(name),
    local: nId(name),
    importKind: "value",
  };
}

/** Type guard for MemberExpression nodes. */
function isMemberExpression(node: ESTNode): node is MemberExpression {
  return node.type === "MemberExpression";
}

/** Type guard for Identifier nodes. */
function isIdentifier(node: ESTNode): node is Identifier {
  return node.type === "Identifier";
}

/** Type guard for CallExpression nodes. */
function isCallExpression(node: ESTNode): node is CallExpression {
  return node.type === "CallExpression";
}

/** Type guard for VariableDeclaration nodes. */
function isVariableDeclaration(node: ESTNode): node is VariableDeclaration {
  return node.type === "VariableDeclaration";
}

/** Type guard for string Literal nodes. */
function isStringLiteral(node: ESTNode | null): node is Literal {
  return (
    node !== null &&
    node.type === "Literal" &&
    typeof node["value"] === "string"
  );
}

export {
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isStringLiteral,
  isVariableDeclaration,
  nArr,
  nArrowBlock,
  nBlock,
  nCall,
  nConst,
  nExprStmt,
  nId,
  nImport,
  nImportSpecifier,
  nLit,
  nMember,
  nNew,
  nObj,
  nProp,
  nReturn,
  nSpread,
};
export type {
  ArrowFunctionExpression,
  BlockStatement,
  CallExpression,
  ESTNode,
  Identifier,
  Literal,
  MemberExpression,
  Program,
  ReturnStatement,
  VariableDeclaration,
  VariableDeclarator,
};
