import { nId, nLit, nMember } from "@/transform/ast/implementation";
import type { ESTNode } from "@/transform/ast/implementation";
import {
  COLOCATED_CLIENT_STRATEGIES,
  DEFAULT_INTERACTION_EVENT_TYPE,
  ISLAND_STRATEGIES,
  isColocatedClientStrategyName,
} from "@dathomir/shared";

interface JSXIdentifier {
  type: "JSXIdentifier";
  name: string;
}

interface JSXMemberExpression {
  type: "JSXMemberExpression";
  object: JSXIdentifier | JSXMemberExpression;
  property: JSXIdentifier;
}

interface JSXNamespacedName {
  type: "JSXNamespacedName";
  namespace: JSXIdentifier;
  name: JSXIdentifier;
}

type JSXName = JSXIdentifier | JSXMemberExpression | JSXNamespacedName;
type IslandsDirectiveName = (typeof ISLAND_STRATEGIES)[number];
type ColocatedClientStrategyName = (typeof COLOCATED_CLIENT_STRATEGIES)[number];

interface JSXOpeningElement {
  type: "JSXOpeningElement";
  name: JSXName;
  attributes: (JSXAttribute | JSXSpreadAttribute)[];
  selfClosing: boolean;
}

interface JSXAttribute extends ESTNode {
  type: "JSXAttribute";
  name: JSXIdentifier | JSXNamespacedName;
  value: ESTNode | null;
}

interface JSXSpreadAttribute extends ESTNode {
  type: "JSXSpreadAttribute";
  argument: ESTNode;
}

interface JSXElement extends ESTNode {
  type: "JSXElement";
  openingElement: JSXOpeningElement;
  children: JSXChild[];
  closingElement: ESTNode | null;
}

interface JSXFragment extends ESTNode {
  type: "JSXFragment";
  children: JSXChild[];
}

interface JSXText extends ESTNode {
  type: "JSXText";
  value: string;
}

interface JSXExpressionContainer extends ESTNode {
  type: "JSXExpressionContainer";
  expression: ESTNode;
}

interface JSXEmptyExpression extends ESTNode {
  type: "JSXEmptyExpression";
}

interface JSXSpreadChild extends ESTNode {
  type: "JSXSpreadChild";
  expression: ESTNode;
}

type JSXChild =
  | JSXElement
  | JSXFragment
  | JSXText
  | JSXExpressionContainer
  | JSXSpreadChild;

/**
 * Check if a string is a valid JavaScript identifier.
 */
function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

/**
 * Check if a JSX element name represents a component.
 * Per JSX convention: uppercase = component, lowercase = HTML element.
 */
function isComponentTag(name: JSXName): boolean {
  if (name.type === "JSXIdentifier") {
    return /^[A-Z]/.test(name.name);
  }
  if (name.type === "JSXMemberExpression") {
    return true;
  }
  return false;
}

/**
 * Convert a JSX element name to an ESTree expression node for function call.
 */
function jsxNameToExpression(name: JSXName): ESTNode {
  if (name.type === "JSXIdentifier") {
    return nId(name.name);
  }
  if (name.type === "JSXMemberExpression") {
    return nMember(jsxNameToExpression(name.object), nId(name.property.name));
  }
  return nId(`${name.namespace.name}_${name.name.name}`);
}

/**
 * Get tag name string from JSX name node.
 */
function getTagName(name: JSXName): string {
  if (name.type === "JSXIdentifier") {
    return name.name;
  }
  if (name.type === "JSXMemberExpression") {
    return `${getTagName(name.object)}.${name.property.name}`;
  }
  return `${name.namespace.name}:${name.name.name}`;
}

function isClientDirectiveNamespace(name: JSXAttribute["name"]): boolean {
  return (
    (name.type === "JSXNamespacedName" && name.namespace.name === "client") ||
    (name.type === "JSXIdentifier" && name.name.startsWith("client:"))
  );
}

function getRawAttributeName(name: JSXAttribute["name"]): string | null {
  if (name.type === "JSXNamespacedName") {
    return `${name.namespace.name}:${name.name.name}`;
  }

  if (name.type === "JSXIdentifier") {
    return name.name;
  }

  return null;
}

function getColocatedClientDirective(
  name: JSXAttribute["name"],
): {
  strategy: ColocatedClientStrategyName;
  event: typeof DEFAULT_INTERACTION_EVENT_TYPE;
} | null {
  const rawName = getRawAttributeName(name);
  if (rawName === null) {
    return null;
  }

  const [strategy, event] = rawName.split(":");
  if (
    !isColocatedClientStrategyName(strategy ?? null) ||
    event !== "onClick"
  ) {
    return null;
  }

  return {
    strategy: strategy as ColocatedClientStrategyName,
    event: DEFAULT_INTERACTION_EVENT_TYPE,
  };
}

function getIslandsDirectiveName(
  name: JSXAttribute["name"],
): IslandsDirectiveName | null {
  switch (getRawAttributeName(name)) {
    case "client:load":
      return "load";
    case "client:visible":
      return "visible";
    case "client:idle":
      return "idle";
    case "client:interaction":
      return "interaction";
    case "client:media":
      return "media";
    default:
      return null;
  }
}

function normalizeIslandsDirectiveValue(
  directive: IslandsDirectiveName,
  value: JSXAttribute["value"],
): ESTNode | null {
  const invalidValueError = (message: string) => {
    throw new Error(`[dathomir] ${message}`);
  };

  if (value === null) {
    if (directive === "interaction") {
      return nLit(DEFAULT_INTERACTION_EVENT_TYPE);
    }

    if (directive === "media") {
      invalidValueError("client:media requires a string literal media query");
    }

    return null;
  }

  if (directive === "load" || directive === "visible" || directive === "idle") {
    invalidValueError(`client:${directive} does not accept a value`);
  }

  let normalizedValue: ESTNode | null = null;

  if (value.type === "Literal") {
    normalizedValue = value;
  } else if (value.type === "JSXExpressionContainer") {
    const expression = value.expression as ESTNode;
    normalizedValue =
      expression.type === "JSXEmptyExpression" ? null : expression;
  }

  if (
    normalizedValue?.type === "Literal" &&
    typeof normalizedValue.value === "string"
  ) {
    return normalizedValue;
  }

  if (directive === "interaction") {
    invalidValueError(
      "client:interaction accepts only string literal event types",
    );
  }

  return invalidValueError(
    "client:media requires a string literal media query",
  );
}

export {
  getColocatedClientDirective,
  isClientDirectiveNamespace,
  getIslandsDirectiveName,
  getTagName,
  isComponentTag,
  isValidIdentifier,
  jsxNameToExpression,
  normalizeIslandsDirectiveValue,
};
export type {
  ColocatedClientStrategyName,
  IslandsDirectiveName,
  JSXAttribute,
  JSXChild,
  JSXElement,
  JSXEmptyExpression,
  JSXExpressionContainer,
  JSXFragment,
  JSXIdentifier,
  JSXMemberExpression,
  JSXName,
  JSXNamespacedName,
  JSXOpeningElement,
  JSXSpreadAttribute,
  JSXSpreadChild,
  JSXText,
};
