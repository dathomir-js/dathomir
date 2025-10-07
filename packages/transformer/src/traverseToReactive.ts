import traverseCjs from "@babel/traverse";
import type { Binding, NodePath, TraverseOptions } from "@babel/traverse";
import * as t from "@babel/types";
import { parseToAst } from "./parseToAst";

// ESモジュール互換性のため
const traverse =
  ((traverseCjs as any).default as typeof traverseCjs) || traverseCjs;

const REACTIVITY_MODULE = "@ailuros/core/reactivity";
const COMPUTED_EXPORT_NAME = "computed";
const SIGNAL_EXPORT_NAME = "signal";

/**
 * State object for tracking reactive bindings and imports during AST traversal.
 */
interface TransformState {
  /** Reference to the Program node path */
  programPath: NodePath<t.Program> | null;
  /** Local names of imported reactive creator functions (signal, computed) */
  reactiveCreatorNames: Set<string>;
  /** Bindings that were created by reactive creators */
  reactiveBindings: Set<Binding>;
  /** Local name of the computed import */
  computedImportName: string | null;
  /** Local names of namespace imports from @ailuros/reactivity */
  namespaceImports: Set<string>;
  /** Local names of default imports from @ailuros/reactivity */
  defaultImports: Set<string>;
  /** Paths to import declarations from @ailuros/reactivity */
  reactivityImportPaths: NodePath<t.ImportDeclaration>[];
  /** Whether computed was used in wrapping expressions */
  computedUsed: boolean;
  /** Whether computed import was added during transformation */
  addedComputedImport: boolean;
}

/**
 * Extracts the name from an import specifier.
 * @param specifier - The import specifier node
 * @returns The imported name as a string
 */
const getSpecifierName = (specifier: t.ImportSpecifier) =>
  t.isIdentifier(specifier.imported)
    ? specifier.imported.name
    : specifier.imported.value;

/**
 * Checks if a property matches the expected reactive factory name.
 * @param property - The property identifier or private name
 * @param expected - The expected name to match
 * @returns True if the property is an identifier with the expected name
 */
const isReactiveFactory = (
  property: t.Identifier | t.PrivateName,
  expected: string
) => t.isIdentifier(property) && property.name === expected;

/**
 * Collects reactive bindings created by signal() or computed() calls.
 * @param path - The variable declarator path
 * @param state - The transform state
 */
const collectReactiveBinding = (
  path: NodePath<t.VariableDeclarator>,
  state: TransformState
) => {
  const { node } = path;

  if (!t.isIdentifier(node.id)) {
    return;
  }

  const initPath = path.get("init");

  if (!initPath.isCallExpression()) {
    return;
  }

  if (!isReactiveCreatorCallee(initPath.get("callee"), state)) {
    return;
  }

  const binding = path.scope.getBinding(node.id.name);

  if (binding) {
    state.reactiveBindings.add(binding);
  }
};

/**
 * Checks if a callee is a reactive creator function (signal or computed).
 * @param calleePath - The callee path to check
 * @param state - The transform state
 * @returns True if the callee is a reactive creator
 */
const isReactiveCreatorCallee = (
  calleePath: NodePath<t.CallExpression["callee"]>,
  state: TransformState
) => {
  const callee = calleePath.node;

  if (t.isIdentifier(callee)) {
    return state.reactiveCreatorNames.has(callee.name);
  }

  if (
    t.isMemberExpression(callee) &&
    !callee.computed &&
    t.isIdentifier(callee.property)
  ) {
    if (
      t.isIdentifier(callee.object) &&
      (state.namespaceImports.has(callee.object.name) ||
        state.defaultImports.has(callee.object.name)) &&
      (isReactiveFactory(callee.property, SIGNAL_EXPORT_NAME) ||
        isReactiveFactory(callee.property, COMPUTED_EXPORT_NAME))
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Checks if an expression contains references to reactive bindings.
 * @param expressionPath - The expression path to check
 * @param state - The transform state
 * @returns True if the expression contains reactive references
 */
const containsReactiveReference = (
  expressionPath: NodePath<t.Expression>,
  state: TransformState
) => {
  if (expressionPath.isIdentifier()) {
    const binding = expressionPath.scope.getBinding(expressionPath.node.name);

    if (binding && state.reactiveBindings.has(binding)) {
      return true;
    }
  }

  let found = false;

  expressionPath.traverse(
    {
      Identifier(path) {
        if (!path.isReferencedIdentifier()) {
          return;
        }

        const binding = path.scope.getBinding(path.node.name);

        if (binding && state.reactiveBindings.has(binding)) {
          found = true;
          path.stop();
        }
      },
    },
    state
  );

  return found;
};

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
    state.addedComputedImport = true;
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
  state.addedComputedImport = true;
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
 * Wraps JSX expressions containing reactive references with computed().
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

  if (!containsReactiveReference(expressionPath, state)) {
    return;
  }

  const callee = getComputedCallee(state);
  const clonedExpression = t.cloneNode(expressionPath.node, true);
  const arrow = t.arrowFunctionExpression([], clonedExpression);

  expressionPath.replaceWith(t.callExpression(callee, [arrow]));
  state.computedUsed = true;
};

const visitor: TraverseOptions<TransformState> = {
  Program: {
    enter(path, state) {
      state.programPath = path;
    },
    exit(path, state) {
      if (state.addedComputedImport) {
        path.scope.crawl();
      }
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

        if (
          importedName === SIGNAL_EXPORT_NAME ||
          importedName === COMPUTED_EXPORT_NAME
        ) {
          state.reactiveCreatorNames.add(specifier.local.name);
        }

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
  VariableDeclarator(path, state) {
    collectReactiveBinding(path, state);
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
    reactiveCreatorNames: new Set<string>(),
    reactiveBindings: new Set<Binding>(),
    computedImportName: null,
    namespaceImports: new Set<string>(),
    defaultImports: new Set<string>(),
    reactivityImportPaths: [],
    computedUsed: false,
    addedComputedImport: false,
  };

  traverse(ast, visitor, undefined, state);
};
