import { describe, expect, it } from "vitest";

import { nId } from "@/transform/ast/implementation";
import { createInitialState } from "@/transform/state/implementation";
import type { ESTNode } from "@/transform/ast/implementation";
import type {
  JSXElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXSpreadChild,
  JSXText,
} from "@/transform/jsx/implementation";

import {
  containsReactiveAccess,
  jsxToTree,
  processAttributes,
} from "./implementation";
import type { NestedTransformers } from "./implementation";

const nested: NestedTransformers = {
  transformJSXNode: () => nId("CSR_NODE"),
  transformJSXForSSRNode: () => nId("SSR_NODE"),
};

function text(value: string): JSXText {
  return { type: "JSXText", value };
}

function expr(expression: ESTNode): JSXExpressionContainer {
  return { type: "JSXExpressionContainer", expression };
}

function div(
  children: (
    | JSXElement
    | JSXFragment
    | JSXText
    | JSXExpressionContainer
    | JSXSpreadChild
  )[],
): JSXElement {
  return {
    type: "JSXElement",
    openingElement: {
      type: "JSXOpeningElement",
      name: { type: "JSXIdentifier", name: "div" },
      attributes: [],
      selfClosing: false,
    },
    children,
    closingElement: null,
  };
}

describe("transform/tree", () => {
  it("containsReactiveAccess detects .value member usage", () => {
    const reactive = {
      type: "MemberExpression",
      object: nId("count"),
      property: nId("value"),
      computed: false,
      optional: false,
    };
    const plain = {
      type: "MemberExpression",
      object: nId("foo"),
      property: nId("bar"),
      computed: false,
      optional: false,
    };

    expect(containsReactiveAccess(reactive)).toBe(true);
    expect(containsReactiveAccess(plain)).toBe(false);
  });

  it("processAttributes emits dynamic attr part for reactive expression", () => {
    const dynamicParts: Parameters<typeof processAttributes>[1] = [];
    const attributes: Parameters<typeof processAttributes>[0] = [
      {
        type: "JSXAttribute",
        name: { type: "JSXIdentifier", name: "class" },
        value: expr({
          type: "MemberExpression",
          object: nId("state"),
          property: nId("value"),
          computed: false,
          optional: false,
        }),
      },
    ];

    processAttributes(attributes, dynamicParts, [0]);

    expect(dynamicParts).toHaveLength(1);
    expect(dynamicParts[0]?.type).toBe("attr");
    expect(dynamicParts[0]?.key).toBe("class");
  });

  it("jsxToTree keeps fragment dynamic text parts", () => {
    const state = createInitialState("csr");
    const fragment: JSXFragment = {
      type: "JSXFragment",
      children: [div([expr(nId("count"))])],
    };

    const result = jsxToTree(fragment, state, nested);

    expect(result.dynamicParts.some((part) => part.type === "text")).toBe(true);
  });

  it("jsxToTree records component child as insert component part", () => {
    const state = createInitialState("csr");
    const tree = div([
      {
        type: "JSXElement",
        openingElement: {
          type: "JSXOpeningElement",
          name: { type: "JSXIdentifier", name: "Counter" },
          attributes: [],
          selfClosing: true,
        },
        children: [],
        closingElement: null,
      },
      text("ok"),
    ]);

    const result = jsxToTree(tree, state, nested);
    const insertPart = result.dynamicParts.find((part) => part.type === "insert");

    expect(insertPart).toBeDefined();
    expect(insertPart?.isComponent).toBe(true);
  });

  it("processAttributes keeps namespaced attribute keys as string literals", () => {
    const dynamicParts: Parameters<typeof processAttributes>[1] = [];
    const attributes: Parameters<typeof processAttributes>[0] = [
      {
        type: "JSXAttribute",
        name: {
          type: "JSXNamespacedName",
          namespace: { type: "JSXIdentifier", name: "xlink" },
          name: { type: "JSXIdentifier", name: "href" },
        },
        value: { type: "Literal", value: "#icon", raw: '"#icon"' },
      },
    ];

    const result = processAttributes(attributes, dynamicParts, [0]);

    expect(result.attrs.type).toBe("ObjectExpression");
    const objectExpression = result.attrs as {
      type: "ObjectExpression";
      properties: Array<{ key: { type: string; value?: unknown } }>;
    };
    const keyNode = objectExpression.properties[0]?.key;
    expect(keyNode?.type).toBe("Literal");
    expect(keyNode?.value).toBe("xlink:href");
  });

  it("jsxToTree treats logical expression children as insert dynamic parts", () => {
    const state = createInitialState("csr");
    const tree = div([
      expr({
        type: "LogicalExpression",
        operator: "&&",
        left: nId("visible"),
        right: {
          type: "JSXElement",
          openingElement: {
            type: "JSXOpeningElement",
            name: { type: "JSXIdentifier", name: "span" },
            attributes: [],
            selfClosing: false,
          },
          children: [{ type: "JSXText", value: "ok" }],
          closingElement: null,
        },
      }),
    ]);

    const result = jsxToTree(tree, state, nested);

    expect(result.dynamicParts.some((part) => part.type === "insert")).toBe(true);
  });

  it("jsxToTree treats expressions that contain nested JSX as insert dynamic parts", () => {
    const state = createInitialState("csr");
    const tree = div([
      expr({
        type: "ArrayExpression",
        elements: [
          {
            type: "JSXElement",
            openingElement: {
              type: "JSXOpeningElement",
              name: { type: "JSXIdentifier", name: "em" },
              attributes: [],
              selfClosing: false,
            },
            children: [{ type: "JSXText", value: "a" }],
            closingElement: null,
          },
        ],
      }),
    ]);

    const result = jsxToTree(tree, state, nested);

    expect(result.dynamicParts.some((part) => part.type === "insert")).toBe(true);
  });

  it("jsxToTree treats JSXSpreadChild as insert dynamic parts", () => {
    const state = createInitialState("csr");
    const tree = div([
      {
        type: "JSXSpreadChild",
        expression: nId("children"),
      },
    ]);

    const result = jsxToTree(tree, state, nested);

    expect(result.dynamicParts.some((part) => part.type === "insert")).toBe(true);
  });
});
