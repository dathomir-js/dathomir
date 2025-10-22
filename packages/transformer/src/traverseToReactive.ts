import traverseCjs from "@babel/traverse";
import type { NodePath, TraverseOptions } from "@babel/traverse";
import * as t from "@babel/types";
import { parseToAst } from "./parseToAst";

// ESモジュール互換性のため
const traverse =
  ((traverseCjs as any).default as typeof traverseCjs) || traverseCjs;

const REACTIVITY_MODULE = "@dathomir/core/reactivity";
const COMPUTED_EXPORT_NAME = "computed";

/**
 * State object for tracking reactive bindings and imports during AST traversal.
 */
interface TransformState {
  /** Program ノード */
  programPath: NodePath<t.Program> | null;
  /** import * as X / import X from の namespace / default 名 */
  namespaceImports: Set<string>;
  defaultImports: Set<string>;
  /** import { computed as Y } のローカル名 */
  computedImportName: string | null;
  /** 対象モジュールの import 宣言パス */
  reactivityImportPaths: NodePath<t.ImportDeclaration>[];
}

/** import specifier の imported 名取得 */
const getSpecifierName = (specifier: t.ImportSpecifier) =>
  t.isIdentifier(specifier.imported)
    ? specifier.imported.name
    : specifier.imported.value;

// NOTE: 仕様変更によりリアクティブ参照判定ロジックは撤去（常に wrap）。

/**
 * Checks if a callee references the computed function.
 * @param calleePath - The callee path to check
 * @param state - The transform state
 * @returns True if the callee is a computed reference
 */
const isComputedReference = (
  calleePath: NodePath<t.CallExpression["callee"]>,
  state: TransformState
) => {
  const callee = calleePath.node;

  if (t.isIdentifier(callee)) {
    if (state.computedImportName && callee.name === state.computedImportName) {
      return true;
    }
    const binding = calleePath.scope.getBinding(callee.name);
    if (binding && binding.path.isImportSpecifier()) {
      const imported = getSpecifierName(binding.path.node);
      if (
        imported === COMPUTED_EXPORT_NAME &&
        t.isImportDeclaration(binding.path.parent) &&
        binding.path.parent.source.value === REACTIVITY_MODULE
      ) {
        return true;
      }
    }
  }

  if (
    t.isMemberExpression(callee) &&
    !callee.computed &&
    t.isIdentifier(callee.property) &&
    callee.property.name === COMPUTED_EXPORT_NAME &&
    t.isIdentifier(callee.object) &&
    (state.namespaceImports.has(callee.object.name) ||
      state.defaultImports.has(callee.object.name))
  ) {
    return true;
  }

  return false;
};

/**
 * Checks if an expression is already a computed() call.
 * @param expressionPath - The expression path to check
 * @param state - The transform state
 * @returns True if the expression is a computed call
 */
const isComputedCallExpression = (
  expressionPath: NodePath<t.Expression>,
  state: TransformState
) =>
  expressionPath.isCallExpression() &&
  isComputedReference(expressionPath.get("callee"), state);

/**
 * Ensures that the computed function is imported, adding it if necessary.
 * @param state - The transform state
 * @returns The local name of the computed import
 */
const ensureComputedImport = (state: TransformState) => {
  if (state.computedImportName) {
    return state.computedImportName;
  }

  const programPath = state.programPath;

  if (!programPath) {
    throw new Error("Program path is not initialized.");
  }

  const preferredName = programPath.scope.hasBinding(COMPUTED_EXPORT_NAME)
    ? programPath.scope.generateUidIdentifier(COMPUTED_EXPORT_NAME).name
    : COMPUTED_EXPORT_NAME;

  const localId = t.identifier(preferredName);
  const importedId = t.identifier(COMPUTED_EXPORT_NAME);

  if (state.reactivityImportPaths.length > 0) {
    const importPath = state.reactivityImportPaths[0];

    if (
      !importPath.node.specifiers.some(
        (specifier) =>
          t.isImportSpecifier(specifier) &&
          getSpecifierName(specifier) === COMPUTED_EXPORT_NAME
      )
    ) {
      importPath.node.specifiers.push(t.importSpecifier(localId, importedId));
    }

    state.computedImportName = preferredName;
    return preferredName;
  }

  const importDeclaration = t.importDeclaration(
    [t.importSpecifier(localId, importedId)],
    t.stringLiteral(REACTIVITY_MODULE)
  );

  const [newImportPath] = programPath.unshiftContainer(
    "body",
    importDeclaration
  );

  state.reactivityImportPaths.push(
    newImportPath as NodePath<t.ImportDeclaration>
  );
  state.computedImportName = preferredName;
  return preferredName;
};

/**
 * Gets the appropriate callee expression for computed based on import style.
 * @param state - The transform state
 * @returns The callee expression (identifier or member expression)
 */
const getComputedCallee = (state: TransformState): t.Expression => {
  if (state.computedImportName) {
    return t.identifier(state.computedImportName);
  }

  const namespaceIterator = state.namespaceImports.values().next();

  if (!namespaceIterator.done) {
    return t.memberExpression(
      t.identifier(namespaceIterator.value),
      t.identifier(COMPUTED_EXPORT_NAME)
    );
  }

  const defaultIterator = state.defaultImports.values().next();

  if (!defaultIterator.done) {
    return t.memberExpression(
      t.identifier(defaultIterator.value),
      t.identifier(COMPUTED_EXPORT_NAME)
    );
  }

  const identifierName = ensureComputedImport(state);
  return t.identifier(identifierName);
};

/**
 * Wraps ALL JSX expressions with computed().
 * @param path - The JSX expression container path
 * @param state - The transform state
 */
const wrapExpressionWithComputed = (
  path: NodePath<t.JSXExpressionContainer>,
  state: TransformState
) => {
  const expressionPath = path.get("expression");

  if (!expressionPath || expressionPath.isJSXEmptyExpression()) {
    return;
  }

  if (!expressionPath.isExpression()) {
    return;
  }

  if (isComputedCallExpression(expressionPath, state)) {
    return;
  }

  const callee = getComputedCallee(state);
  const clonedExpression = t.cloneNode(expressionPath.node, true);
  const arrow = t.arrowFunctionExpression([], clonedExpression);
  expressionPath.replaceWith(t.callExpression(callee, [arrow]));
};

const visitor: TraverseOptions<TransformState> = {
  Program: {
    enter(path, state) {
      state.programPath = path;
    },
    exit(path) {
      // import 追加後の scope 再構築は必要なケースのみ (現状常に一度で軽量なので常時 crawl でも差は小)
      path.scope.crawl();
    },
  },
  ImportDeclaration(path, state) {
    if (path.node.source.value !== REACTIVITY_MODULE) {
      return;
    }

    state.reactivityImportPaths.push(path);

    for (const specifier of path.node.specifiers) {
      if (t.isImportSpecifier(specifier)) {
        const importedName = getSpecifierName(specifier);
        if (importedName === COMPUTED_EXPORT_NAME) {
          state.computedImportName = specifier.local.name;
        }
      } else if (t.isImportNamespaceSpecifier(specifier)) {
        state.namespaceImports.add(specifier.local.name);
      } else if (t.isImportDefaultSpecifier(specifier)) {
        state.defaultImports.add(specifier.local.name);
      }
    }
  },
  JSXExpressionContainer(path, state) {
    wrapExpressionWithComputed(path, state);
  },
};

/**
 * Traverses an AST and wraps reactive references in JSX with computed().
 * @param ast - The parsed AST from parseToAst
 */
export const traverseToReactive = (ast: ReturnType<typeof parseToAst>) => {
  const state: TransformState = {
    programPath: null,
    namespaceImports: new Set<string>(),
    defaultImports: new Set<string>(),
    computedImportName: null,
    reactivityImportPaths: [],
  };

  traverse(ast, visitor, undefined, state);
};
