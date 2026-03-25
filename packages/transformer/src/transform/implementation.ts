import { parseSync } from "oxc-parser";
import { print } from "esrap";
import ts from "esrap/languages/ts";
import { walk } from "zimmerframe";
import { ISLAND_METADATA_ATTRIBUTE } from "@dathomir/shared";

import {
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isStringLiteral,
  nArr,
  nArrowBlock,
  nBlock,
  nCall,
  nId,
  nLit,
  nMember,
  nObj,
  nProp,
  nReturn,
} from "@/transform/ast/implementation";
import type { ESTNode, Program } from "@/transform/ast/implementation";
import { getTagName, isComponentTag } from "@/transform/jsx/implementation";
import type { JSXElement, JSXFragment } from "@/transform/jsx/implementation";
import { transformJSXNode } from "@/transform/mode-csr/implementation";
import { transformJSXForSSRNode } from "@/transform/mode-ssr/implementation";
import { addRuntimeImports } from "@/transform/runtimeImports/implementation";
import { createInitialState } from "@/transform/state/implementation";
import { buildComponentCall, jsxToTree } from "@/transform/tree/implementation";
import type { DynamicPart, NestedTransformers } from "@/transform/tree/implementation";

import type { TransformOptions, TransformResult } from "../types";

interface FunctionLikeNode extends ESTNode {
  params?: ESTNode[];
  body: ESTNode;
}

interface CollectedComponentPlan {
  bodyIndex: number;
  declarationIndex: number;
  metadata: ESTNode;
}

interface ComponentRenderAnalysis {
  jsxRoot: JSXElement | JSXFragment;
  paramPattern: ESTNode | null;
  preludeStatements: ESTNode[];
}

interface FunctionRenderFrame {
  paramPatterns: ESTNode[];
  preludeStatements: ESTNode[];
  returnExpression: ESTNode | null;
}

interface ComponentHydrationBuildResult {
  metadata: ESTNode;
}

type HelperLookup = ReadonlyMap<string, ESTNode>;

interface ResolvedHelperCall {
  helperName: string;
  helperNode: ESTNode;
  helperFrame: FunctionRenderFrame;
  callArguments: ESTNode[];
}

interface HelperChainResolution {
  rootFrame: FunctionRenderFrame;
  helperFrames: Array<{
    helperName: string;
    helperFrame: FunctionRenderFrame;
    callArguments: ESTNode[];
  }>;
}

interface ResolvedRenderAnalysis {
  analysis: ComponentRenderAnalysis;
  usedHelper: boolean;
}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- internal ESTree-like program is structurally compatible with esrap's expected node type
  return program as any;
}

function isJSXElement(node: ESTNode): node is JSXElement {
  return node.type === "JSXElement";
}

function isJSXFragment(node: ESTNode): node is JSXFragment {
  return node.type === "JSXFragment";
}

function isFunctionLikeNode(node: ESTNode | null | undefined): node is FunctionLikeNode {
  return node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression";
}

function isBlockStatement(node: ESTNode | null | undefined): node is ESTNode & { body: ESTNode[] } {
  return node?.type === "BlockStatement" && Array.isArray(node.body);
}

function isReturnStatement(node: ESTNode | null | undefined): node is ESTNode & { argument: ESTNode | null } {
  return node?.type === "ReturnStatement";
}

function isVariableDeclaration(node: ESTNode | null | undefined): node is ESTNode & {
  declarations: Array<{ id: ESTNode; init?: ESTNode | null }>;
} {
  return node?.type === "VariableDeclaration" && Array.isArray(node.declarations);
}

function isExportNamedDeclaration(node: ESTNode | null | undefined): node is ESTNode & {
  declaration?: ESTNode | null;
} {
  return node?.type === "ExportNamedDeclaration";
}

function isFunctionDeclaration(node: ESTNode | null | undefined): node is ESTNode & {
  id?: ESTNode | null;
  params?: ESTNode[];
  body: ESTNode;
} {
  return node?.type === "FunctionDeclaration";
}

function isDefineComponentCall(node: ESTNode | null | undefined): node is ESTNode & {
  arguments: ESTNode[];
} {
  if (node === null || node === undefined || !isCallExpression(node)) {
    return false;
  }

  return isIdentifier(node.callee) && node.callee.name === "defineComponent";
}

function cloneNode<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function containsJSXNode(node: ESTNode): boolean {
  if (node.type === "JSXElement" || node.type === "JSXFragment") {
    return true;
  }

  let found = false;
  walk(node, null, {
    JSXElement() {
      found = true;
    },
    JSXFragment() {
      found = true;
    },
  });
  return found;
}

function containsIdentifierNamed(
  node: ESTNode,
  names: readonly string[],
): boolean {
  if (isIdentifier(node) && names.includes(node.name)) {
    return true;
  }

  let found = false;
  walk(node, null, {
    Identifier(candidate: ESTNode) {
      if (isIdentifier(candidate) && names.includes(candidate.name)) {
        found = true;
      }
    },
  });
  return found;
}

function containsNodeType(node: ESTNode, types: readonly string[]): boolean {
  if (types.includes(node.type)) {
    return true;
  }

  let found = false;
  walk(node, null, {
    _: (candidate: ESTNode) => {
      if (types.includes(candidate.type)) {
        found = true;
      }
    },
  });
  return found;
}

function isObjectExpression(
  node: ESTNode | null | undefined,
): node is ESTNode & { properties: ESTNode[] } {
  return node?.type === "ObjectExpression" && Array.isArray(node.properties);
}

function isNewExpression(node: ESTNode | null | undefined): node is ESTNode & {
  callee: ESTNode;
} {
  return node?.type === "NewExpression";
}

function unwrapParenthesizedExpression(node: ESTNode): ESTNode {
  let current = node;
  while (current.type === "ParenthesizedExpression" && current.expression) {
    current = current.expression as ESTNode;
  }
  return current;
}

function getReturnedExpression(componentArg: ESTNode): ESTNode | null {
  if (!isFunctionLikeNode(componentArg)) {
    return null;
  }

  if (!isBlockStatement(componentArg.body)) {
    return unwrapParenthesizedExpression(componentArg.body);
  }

  for (const statement of componentArg.body.body) {
    if (isReturnStatement(statement)) {
      return statement.argument ?? null;
    }
  }

  return null;
}

function resolveTopLevelHelperNode(
  callExpression: ESTNode,
  helperLookup: HelperLookup,
  visitedHelpers: ReadonlySet<string>,
): ResolvedHelperCall | null {
  if (!isCallExpression(callExpression)) {
    return null;
  }

  if (!isIdentifier(callExpression.callee)) {
    return null;
  }

  const helperName = callExpression.callee.name;
  if (visitedHelpers.has(helperName)) {
    return null;
  }

  const helperNode = helperLookup.get(helperName);
  if (!isFunctionLikeNode(helperNode) && !isFunctionDeclaration(helperNode)) {
    return null;
  }

  const helperFrame = extractFunctionRenderFrame(helperNode);
  if (helperFrame === null) {
    return null;
  }

  if (callExpression.arguments.length !== helperFrame.paramPatterns.length) {
    return null;
  }

  return {
    helperName,
    helperNode,
    helperFrame,
    callArguments: callExpression.arguments,
  };
}

function containsNodeIdentityCreation(node: ESTNode): boolean {
  let found = false;
  const documentFactoryNames = [
    "createElement",
    "createTextNode",
    "createComment",
    "createDocumentFragment",
  ];
  const domConstructors = ["Text", "Comment", "DocumentFragment"];

  walk(node, null, {
    CallExpression(candidate: ESTNode) {
      if (
        isCallExpression(candidate) &&
        isMemberExpression(candidate.callee) &&
        isIdentifier(candidate.callee.object) &&
        candidate.callee.object.name === "document" &&
        isIdentifier(candidate.callee.property) &&
        documentFactoryNames.includes(candidate.callee.property.name)
      ) {
        found = true;
      }
    },
    NewExpression(candidate: ESTNode) {
      if (
        isNewExpression(candidate) &&
        isIdentifier(candidate.callee) &&
        domConstructors.includes(candidate.callee.name)
      ) {
        found = true;
      }
    },
  });

  return found;
}

function hasNonNormalizableSpread(componentArg: ESTNode): boolean {
  const returnedExpression = getReturnedExpression(componentArg);
  if (
    returnedExpression === null ||
    (!isJSXElement(returnedExpression) && !isJSXFragment(returnedExpression))
  ) {
    return false;
  }

  const hasSpreadInNode = (node: JSXElement | JSXFragment): boolean => {
    if (node.type === "JSXElement") {
      for (const attribute of node.openingElement.attributes as ESTNode[]) {
        if (attribute.type !== "JSXSpreadAttribute") {
          continue;
        }

        const argument = unwrapParenthesizedExpression(attribute.argument as ESTNode);
        if (
          isObjectExpression(argument) &&
          argument.properties.some((property) => property.type === "SpreadElement")
        ) {
          return true;
        }
      }

      for (const child of node.children) {
        if (child.type === "JSXElement" || child.type === "JSXFragment") {
          if (hasSpreadInNode(child)) {
            return true;
          }
        }
      }

      return false;
    }

    for (const child of node.children) {
      if (child.type === "JSXElement" || child.type === "JSXFragment") {
        if (hasSpreadInNode(child)) {
          return true;
        }
      }
    }

    return false;
  };

  return hasSpreadInNode(returnedExpression);
}

function hasRuntimeBranching(componentArg: ESTNode): boolean {
  if (!isFunctionLikeNode(componentArg)) {
    return false;
  }

  const unwrappedBody = unwrapParenthesizedExpression(componentArg.body);
  if (
    unwrappedBody.type === "ConditionalExpression" ||
    unwrappedBody.type === "LogicalExpression"
  ) {
    return true;
  }

  if (!isBlockStatement(componentArg.body)) {
    return false;
  }

  for (const statement of componentArg.body.body) {
    if (statement.type === "IfStatement" || statement.type === "SwitchStatement") {
      return true;
    }

    if (
      isReturnStatement(statement) &&
      statement.argument !== null &&
      (() => {
        const returnedExpression = unwrapParenthesizedExpression(statement.argument);
        return (
          returnedExpression.type === "ConditionalExpression" ||
          returnedExpression.type === "LogicalExpression"
        );
      })()
    ) {
      return true;
    }
  }

  return false;
}

function hasOpaqueHelperReturn(
  componentArg: ESTNode,
  helperLookup: HelperLookup,
  visitedHelpers: ReadonlySet<string>,
): boolean {
  const finalExpression = resolveFinalHelperExpression(componentArg, helperLookup, visitedHelpers);
  if (finalExpression === null) {
    return false;
  }

  return isCallExpression(finalExpression);
}

function isSupportedPlanPreludeStatement(node: ESTNode): boolean {
  return node.type === "VariableDeclaration" || node.type === "FunctionDeclaration";
}

function extractFunctionRenderFrame(componentArg: ESTNode): FunctionRenderFrame | null {
  if (!isFunctionLikeNode(componentArg) && !isFunctionDeclaration(componentArg)) {
    return null;
  }

  const paramPatterns = (componentArg.params ?? []).map((param) => cloneNode(param));
  const directBody = unwrapParenthesizedExpression(componentArg.body);
  if (isJSXElement(directBody) || isJSXFragment(directBody) || isCallExpression(directBody)) {
    return {
      paramPatterns,
      preludeStatements: [],
      returnExpression: directBody,
    };
  }

  if (!isBlockStatement(componentArg.body)) {
    return null;
  }

  const statements = componentArg.body.body;
  const preludeStatements: ESTNode[] = [];
  let returnExpression: ESTNode | null = null;

  for (let index = 0; index < statements.length; index += 1) {
    const statement = statements[index];
    if (statement === undefined) {
      return null;
    }

    if (isReturnStatement(statement)) {
      if (statement.argument === null) {
        return null;
      }

      if (index !== statements.length - 1) {
        return null;
      }

      returnExpression = unwrapParenthesizedExpression(statement.argument);
      break;
    }

    if (!isSupportedPlanPreludeStatement(statement) || containsJSXNode(statement)) {
      return null;
    }

    preludeStatements.push(cloneNode(statement));
  }

  if (returnExpression === null) {
    return null;
  }

  return {
    paramPatterns,
    preludeStatements,
    returnExpression,
  };
}

function getRootNamespace(node: JSXElement | JSXFragment): "html" | "svg" | "math" {
  if (node.type === "JSXFragment") {
    return "html";
  }

  const tagName = getTagName(node.openingElement.name);
  if (tagName === "svg") {
    return "svg";
  }
  if (tagName === "math") {
    return "math";
  }
  return "html";
}

function createArrowExpression(params: ESTNode[], body: ESTNode): ESTNode {
  return {
    type: "ArrowFunctionExpression",
    params,
    body,
    expression: true,
  };
}

function createConstDeclaration(id: ESTNode, init: ESTNode): ESTNode {
  return {
    type: "VariableDeclaration",
    kind: "const",
    declarations: [
      {
        type: "VariableDeclarator",
        id,
        init,
      },
    ],
  };
}

function getComponentDisplayName(node: ESTNode): string {
  if (isIdentifier(node)) {
    return node.name;
  }

  if (isMemberExpression(node) && isIdentifier(node.property)) {
    return `${getComponentDisplayName(node.object)}.${node.property.name}`;
  }

  return "unknown-component";
}

function getExplicitNestedBoundary(part: DynamicPart): ESTNode | null {
  if (part.type !== "insert" || part.isComponent !== true) {
    return null;
  }

  if (!isCallExpression(part.expression)) {
    return null;
  }

  const props = part.expression.arguments[0];
  if (props?.type !== "ObjectExpression") {
    return null;
  }

  for (const property of props.properties as ESTNode[]) {
    if (property.type !== "Property") {
      continue;
    }

    const propertyKey = property.key as ESTNode;
    const propertyValue = property.value as ESTNode;
    const matchesKey =
      (isIdentifier(propertyKey) && propertyKey.name === ISLAND_METADATA_ATTRIBUTE) ||
      (isStringLiteral(propertyKey) && propertyKey.value === ISLAND_METADATA_ATTRIBUTE);

    if (!matchesKey || !isStringLiteral(propertyValue)) {
      continue;
    }

    return nObj([
      nProp(nId("path"), nArr(part.path.map((segment) => nLit(segment)))),
      nProp(nId("tagName"), nLit(getComponentDisplayName(part.expression.callee))),
      nProp(nId("islandStrategy"), nLit(propertyValue.value)),
    ]);
  }

  return null;
}

function createPlanBinding(part: DynamicPart, markerId: number | null): ESTNode {
  const sharedProperties = [
    nProp(nId("kind"), nLit(part.type)),
    nProp(nId("path"), nArr(part.path.map((segment) => nLit(segment)))),
  ];

  switch (part.type) {
    case "text":
      return nObj([
        nProp(nId("kind"), nLit("text")),
        nProp(nId("markerId"), nLit(markerId ?? 0)),
        nProp(nId("expression"), createArrowExpression([], cloneNode(part.expression))),
      ]);
    case "attr":
      return nObj([
        ...sharedProperties,
        nProp(nId("key"), nLit(part.key ?? "")),
        nProp(nId("expression"), createArrowExpression([], cloneNode(part.expression))),
      ]);
    case "event":
      return nObj([
        ...sharedProperties,
        nProp(nId("eventType"), nLit(part.key ?? "")),
        nProp(nId("expression"), cloneNode(part.expression)),
      ]);
    case "insert":
      return nObj([
        ...sharedProperties,
        nProp(nId("markerId"), nLit(markerId ?? 0)),
        nProp(nId("expression"), createArrowExpression([], cloneNode(part.expression))),
        nProp(nId("isComponent"), nLit(part.isComponent === true)),
      ]);
    case "spread":
      return nObj([
        ...sharedProperties,
        nProp(nId("expression"), createArrowExpression([], cloneNode(part.expression))),
      ]);
  }
}

function createUnsupportedHydrationMetadata(reason: string): ESTNode {
  return nObj([
    nProp(nId("kind"), nLit("generic-plan")),
    nProp(nId("unsupportedReason"), nLit(reason)),
  ]);
}

function getSpecificUnsupportedHydrationReason(
  componentArg: ESTNode,
  helperLookup: HelperLookup,
  visitedHelpers: ReadonlySet<string>,
): string | null {
  if (!isFunctionLikeNode(componentArg) && !isFunctionDeclaration(componentArg)) {
    return null;
  }

  const bodyToInspect = componentArg.body;

  if (containsNodeIdentityCreation(bodyToInspect)) {
    return "node-identity-reuse";
  }

  if (hasNonNormalizableSpread(componentArg)) {
    return "non-normalizable-spread";
  }

  const imperativeIdentifiers = ["document", "window", "host", "shadowRoot"];
  if (containsIdentifierNamed(bodyToInspect, imperativeIdentifiers)) {
    return "imperative-dom-query";
  }

  if (hasRuntimeBranching(componentArg)) {
    return "runtime-branching";
  }

  if (hasOpaqueHelperReturn(componentArg, helperLookup, visitedHelpers)) {
    return "opaque-helper-call";
  }

  return null;
}

function getUnsupportedHydrationReason(
  componentArg: ESTNode,
  helperLookup: HelperLookup,
  visitedHelpers: ReadonlySet<string>,
): string | null {
  const specificReason = getSpecificUnsupportedHydrationReason(
    componentArg,
    helperLookup,
    visitedHelpers,
  );
  if (specificReason !== null) {
    return specificReason;
  }

  if (!isFunctionLikeNode(componentArg)) {
    return null;
  }

  if (containsNodeType(componentArg.body, ["IfStatement", "SwitchStatement"])) {
    return "runtime-branching";
  }

  return "unsupported-component-body";
}

function resolveHelperChain(
  componentArg: ESTNode,
  helperLookup: HelperLookup,
  visitedHelpers: ReadonlySet<string>,
): HelperChainResolution | null {
  const rootFrame = extractFunctionRenderFrame(componentArg);
  if (rootFrame === null || rootFrame.returnExpression === null) {
    return null;
  }

  const helperFrames: HelperChainResolution["helperFrames"] = [];
  let currentExpression: ESTNode | null = rootFrame.returnExpression;
  let localVisited = new Set(visitedHelpers);

  while (currentExpression !== null && isCallExpression(currentExpression)) {
    const helperResolution = resolveTopLevelHelperNode(
      currentExpression,
      helperLookup,
      localVisited,
    );
    if (helperResolution === null) {
      break;
    }

    helperFrames.push({
      helperName: helperResolution.helperName,
      helperFrame: helperResolution.helperFrame,
      callArguments: helperResolution.callArguments,
    });
    localVisited = new Set([...localVisited, helperResolution.helperName]);
    currentExpression = helperResolution.helperFrame.returnExpression;
  }

  return {
    rootFrame,
    helperFrames,
  };
}

function resolveFinalHelperExpression(
  componentArg: ESTNode,
  helperLookup: HelperLookup,
  visitedHelpers: ReadonlySet<string>,
): ESTNode | null {
  const resolvedChain = resolveHelperChain(componentArg, helperLookup, visitedHelpers);
  if (resolvedChain === null) {
    return null;
  }

  return (
    resolvedChain.helperFrames.at(-1)?.helperFrame.returnExpression ??
    resolvedChain.rootFrame.returnExpression
  );
}

function resolveComponentRenderAnalysis(
  componentArg: ESTNode,
  helperLookup: HelperLookup,
  visitedHelpers: ReadonlySet<string> = new Set(),
): ResolvedRenderAnalysis | null {
  const resolvedChain = resolveHelperChain(componentArg, helperLookup, visitedHelpers);
  if (resolvedChain === null) {
    return null;
  }

  const { rootFrame, helperFrames } = resolvedChain;
  const finalFrame = helperFrames.at(-1)?.helperFrame ?? rootFrame;

  if (finalFrame.returnExpression === null) {
    return null;
  }

  if (!isJSXElement(finalFrame.returnExpression) && !isJSXFragment(finalFrame.returnExpression)) {
    return null;
  }

  const preludeStatements = [...rootFrame.preludeStatements];
  for (const helper of helperFrames) {
    const helperParamBindings = helper.helperFrame.paramPatterns.map((paramPattern, index) =>
      createConstDeclaration(paramPattern, cloneNode(helper.callArguments[index] ?? nLit(null))),
    );

    preludeStatements.push(...helperParamBindings, ...helper.helperFrame.preludeStatements);
  }

  return {
    analysis: {
      jsxRoot: finalFrame.returnExpression,
      paramPattern: rootFrame.paramPatterns[0] ?? null,
      preludeStatements,
    },
    usedHelper: helperFrames.length > 0,
  };
}

function collectTopLevelHelpers(program: Program): HelperLookup {
  const helpers = new Map<string, ESTNode>();

  for (const statement of program.body) {
    const declaration =
      isExportNamedDeclaration(statement) && statement.declaration
        ? statement.declaration
        : statement;

    if (isFunctionDeclaration(declaration) && declaration.id && isIdentifier(declaration.id)) {
      helpers.set(declaration.id.name, declaration);
      continue;
    }

    if (!isVariableDeclaration(declaration)) {
      continue;
    }

    for (const declarator of declaration.declarations) {
      if (
        isIdentifier(declarator.id) &&
        declarator.init !== null &&
        (isFunctionLikeNode(declarator.init) || isFunctionDeclaration(declarator.init))
      ) {
        helpers.set(declarator.id.name, declarator.init);
      }
    }
  }

  return helpers;
}

function buildComponentHydrationMetadata(
  componentArg: ESTNode,
  nested: NestedTransformers,
  helperLookup: HelperLookup,
): ComponentHydrationBuildResult | null {
  const specificUnsupportedReason = getSpecificUnsupportedHydrationReason(
    componentArg,
    helperLookup,
    new Set(),
  );
  if (specificUnsupportedReason !== null) {
    return {
      metadata: createUnsupportedHydrationMetadata(specificUnsupportedReason),
    };
  }

  const resolvedAnalysis = resolveComponentRenderAnalysis(componentArg, helperLookup);
  if (resolvedAnalysis === null) {
    const unsupportedReason = getUnsupportedHydrationReason(
      componentArg,
      helperLookup,
      new Set(),
    );
    if (unsupportedReason === null) {
      return null;
    }

    return {
      metadata: createUnsupportedHydrationMetadata(unsupportedReason),
    };
  }

  const analysis = resolvedAnalysis.analysis;

  const analysisState = createInitialState("csr");
  const { dynamicParts } = jsxToTree(analysis.jsxRoot, analysisState, nested);

  const planBindings: ESTNode[] = [];
  const nestedBoundaries: ESTNode[] = [];
  let markerId = 1;

  for (const part of dynamicParts) {
    const currentMarkerId = part.type === "text" || part.type === "insert" ? markerId++ : null;
    planBindings.push(createPlanBinding(part, currentMarkerId));

    const nestedBoundary = getExplicitNestedBoundary(part);
    if (nestedBoundary !== null) {
      nestedBoundaries.push(nestedBoundary);
    }
  }

  const planFactoryStatements: ESTNode[] = [];
  const setupParamPattern =
    isFunctionLikeNode(componentArg) || isFunctionDeclaration(componentArg)
      ? (componentArg.params?.[0] ?? null)
      : null;

  if (setupParamPattern !== null) {
    planFactoryStatements.push(
      createConstDeclaration(cloneNode(setupParamPattern), nId("__dh_ctx")),
    );
  }
  planFactoryStatements.push(...analysis.preludeStatements);
  planFactoryStatements.push(
    nReturn(
      nObj([
        nProp(nId("namespace"), nLit(getRootNamespace(analysis.jsxRoot))),
        nProp(nId("bindings"), nArr(planBindings)),
        nProp(nId("nestedBoundaries"), nArr(nestedBoundaries)),
      ]),
    ),
  );

  return {
    metadata: nObj([
      nProp(nId("kind"), nLit("generic-plan")),
      nProp(
        nId("planFactory"),
        nArrowBlock([nId("__dh_host"), nId("__dh_ctx")], nBlock(planFactoryStatements)),
      ),
    ]),
  };
}

function collectComponentPlans(
  program: Program,
  nested: NestedTransformers,
): CollectedComponentPlan[] {
  const plans: CollectedComponentPlan[] = [];
  const helperLookup = collectTopLevelHelpers(program);

  for (let bodyIndex = 0; bodyIndex < program.body.length; bodyIndex += 1) {
    const statement = program.body[bodyIndex];
    if (statement === undefined) {
      continue;
    }

    const declaration = isVariableDeclaration(statement)
      ? statement
      : isExportNamedDeclaration(statement) && statement.declaration && isVariableDeclaration(statement.declaration)
        ? statement.declaration
        : null;

    if (declaration === null) {
      continue;
    }

    for (let declarationIndex = 0; declarationIndex < declaration.declarations.length; declarationIndex += 1) {
      const declarator = declaration.declarations[declarationIndex];
      const init = declarator?.init;
      if (!isDefineComponentCall(init)) {
        continue;
      }

      const componentArg = init.arguments[1];
      if (componentArg === undefined) {
        continue;
      }

      const buildResult = buildComponentHydrationMetadata(componentArg, nested, helperLookup);
      if (buildResult === null) {
        continue;
      }

      plans.push({
        bodyIndex,
        declarationIndex,
        metadata: buildResult.metadata,
      });
    }
  }

  return plans;
}

function applyComponentPlans(program: Program, plans: readonly CollectedComponentPlan[]): void {
  for (const plan of plans) {
    const statement = program.body[plan.bodyIndex];
    if (statement === undefined) {
      continue;
    }

    const declaration = isVariableDeclaration(statement)
      ? statement
      : isExportNamedDeclaration(statement) && statement.declaration && isVariableDeclaration(statement.declaration)
        ? statement.declaration
        : null;

    const declarator = declaration?.declarations[plan.declarationIndex];
    const init = declarator?.init;
    if (!isDefineComponentCall(init)) {
      continue;
    }

    const componentArg = init.arguments[1];
    if (componentArg === undefined) {
      continue;
    }

    init.arguments[1] = nCall(nMember(nId("Object"), nId("assign")), [
      componentArg,
      nObj([nProp(nId("__hydrationMetadata__"), cloneNode(plan.metadata))]),
    ]);
  }
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

  const componentPlans = collectComponentPlans(
    adaptParsedProgram(parsed.program) as Program,
    nested,
  );

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

  applyComponentPlans(transformedProgram, componentPlans);

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

  const printableProgram = toPrintableProgram(transformedProgram);

  const { code: outputCode, map: outputMap } = print(
    printableProgram as never,
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
