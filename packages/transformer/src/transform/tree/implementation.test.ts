import { describe, expect, it } from "vitest";

import { nId, nLit } from "@/transform/ast/implementation";
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
  buildComponentCall,
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

    processAttributes(
      attributes,
      dynamicParts,
      [0],
      createInitialState("csr"),
      {
        strategy: null,
      },
    );

    expect(dynamicParts).toHaveLength(1);
    expect(dynamicParts[0]?.type).toBe("attr");
    expect(dynamicParts[0]?.key).toBe("class");
  });

  it("processAttributes keeps non-reactive expression attributes as attr dynamic parts", () => {
    const dynamicParts: Parameters<typeof processAttributes>[1] = [];
    const attributes: Parameters<typeof processAttributes>[0] = [
      {
        type: "JSXAttribute",
        name: { type: "JSXIdentifier", name: "data-render-mode" },
        value: expr(nId("modeLabel")),
      },
    ];

    const result = processAttributes(
      attributes,
      dynamicParts,
      [0],
      createInitialState("csr"),
      { strategy: null },
    );

    expect(result.attrs).toEqual(nLit(null));
    expect(dynamicParts).toHaveLength(1);
    expect(dynamicParts[0]?.type).toBe("attr");
    expect(dynamicParts[0]?.key).toBe("data-render-mode");
    expect(dynamicParts[0]?.expression).toEqual(nId("modeLabel"));
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
    const insertPart = result.dynamicParts.find(
      (part) => part.type === "insert",
    );

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

    const result = processAttributes(
      attributes,
      dynamicParts,
      [0],
      createInitialState("csr"),
      { strategy: null },
    );

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

    expect(result.dynamicParts.some((part) => part.type === "insert")).toBe(
      true,
    );
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

    expect(result.dynamicParts.some((part) => part.type === "insert")).toBe(
      true,
    );
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

    expect(result.dynamicParts.some((part) => part.type === "insert")).toBe(
      true,
    );
  });

  it("keeps local expression identifiers intact in dynamic text parts", () => {
    const state = createInitialState("csr");
    const tree = div([expr(nId("modeLabel"))]);

    const result = jsxToTree(tree, state, nested);
    const textPart = result.dynamicParts.find((part) => part.type === "text");

    expect(textPart).toBeDefined();
    expect(textPart?.expression).toEqual(nId("modeLabel"));
  });

  it("jsxToTree treats .map() call expression as insert dynamic part", () => {
    const state = createInitialState("csr");
    const tree = div([
      expr({
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          object: nId("items"),
          property: nId("map"),
          computed: false,
          optional: false,
        },
        arguments: [nId("renderItem")],
        optional: false,
      }),
    ]);

    const result = jsxToTree(tree, state, nested);

    expect(result.dynamicParts.some((part) => part.type === "insert")).toBe(
      true,
    );
  });

  it("jsxToTree treats ConditionalExpression as insert dynamic part", () => {
    const state = createInitialState("csr");
    const tree = div([
      expr({
        type: "ConditionalExpression",
        test: nId("active"),
        consequent: nLit("yes"),
        alternate: nLit("no"),
      }),
    ]);

    const result = jsxToTree(tree, state, nested);

    expect(result.dynamicParts.some((part) => part.type === "insert")).toBe(
      true,
    );
  });

  it("jsxToTree treats generic CallExpression as insert dynamic part", () => {
    const state = createInitialState("csr");
    const tree = div([
      expr({
        type: "CallExpression",
        callee: nId("renderContent"),
        arguments: [],
        optional: false,
      }),
    ]);

    const result = jsxToTree(tree, state, nested);

    expect(result.dynamicParts.some((part) => part.type === "insert")).toBe(
      true,
    );
  });

  it("processAttributes classifies event handler as event dynamic part", () => {
    const state = createInitialState("csr");
    const element: JSXElement = {
      type: "JSXElement",
      openingElement: {
        type: "JSXOpeningElement",
        name: { type: "JSXIdentifier", name: "button" },
        attributes: [
          {
            type: "JSXAttribute",
            name: { type: "JSXIdentifier", name: "onClick" },
            value: expr(nId("handleClick")),
          },
        ],
        selfClosing: false,
      },
      children: [],
      closingElement: null,
    };

    const result = jsxToTree(element, state, nested);

    const eventPart = result.dynamicParts.find((part) => part.type === "event");
    expect(eventPart).toBeDefined();
    expect(eventPart?.key).toBe("click");
  });

  it("buildComponentCall injects island metadata for client:visible", () => {
    const state = createInitialState("csr");
    const component: JSXElement = {
      type: "JSXElement",
      openingElement: {
        type: "JSXOpeningElement",
        name: { type: "JSXIdentifier", name: "Counter" },
        attributes: [
          {
            type: "JSXAttribute",
            name: {
              type: "JSXNamespacedName",
              namespace: { type: "JSXIdentifier", name: "client" },
              name: { type: "JSXIdentifier", name: "visible" },
            },
            value: null,
          },
        ],
        selfClosing: true,
      },
      children: [],
      closingElement: null,
    };

    const result = buildComponentCall(component, state, nested) as {
      arguments: Array<{
        type: "ObjectExpression";
        properties: Array<{ key: { type: string; value?: unknown } }>;
      }>;
    };

    const props = result.arguments[0];
    expect(props?.type).toBe("ObjectExpression");
    expect(
      props?.properties.some(
        (property) =>
          property.key.type === "Literal" &&
          property.key.value === "data-dh-island",
      ),
    ).toBe(true);
  });

  it("buildComponentCall defaults bare client:interaction to click metadata", () => {
    const state = createInitialState("csr");
    const component: JSXElement = {
      type: "JSXElement",
      openingElement: {
        type: "JSXOpeningElement",
        name: { type: "JSXIdentifier", name: "Counter" },
        attributes: [
          {
            type: "JSXAttribute",
            name: {
              type: "JSXNamespacedName",
              namespace: { type: "JSXIdentifier", name: "client" },
              name: { type: "JSXIdentifier", name: "interaction" },
            },
            value: null,
          },
        ],
        selfClosing: true,
      },
      children: [],
      closingElement: null,
    };

    const result = buildComponentCall(component, state, nested) as {
      arguments: Array<{
        type: "ObjectExpression";
        properties: Array<{
          key: { type: string; value?: unknown };
          value: { type: string; value?: unknown };
        }>;
      }>;
    };

    const props = result.arguments[0];
    const interactionValue = props?.properties.find(
      (property) =>
        property.key.type === "Literal" &&
        property.key.value === "data-dh-island-value",
    );

    expect(interactionValue?.value.type).toBe("Literal");
    expect(interactionValue?.value.value).toBe("click");
  });

  it("jsxToTree throws when client directive is used on html element", () => {
    const state = createInitialState("csr");
    const element: JSXElement = {
      type: "JSXElement",
      openingElement: {
        type: "JSXOpeningElement",
        name: { type: "JSXIdentifier", name: "div" },
        attributes: [
          {
            type: "JSXAttribute",
            name: {
              type: "JSXNamespacedName",
              namespace: { type: "JSXIdentifier", name: "client" },
              name: { type: "JSXIdentifier", name: "visible" },
            },
            value: null,
          },
        ],
        selfClosing: false,
      },
      children: [],
      closingElement: null,
    };

    expect(() => jsxToTree(element, state, nested)).toThrow(
      "client:* directives are only supported on component elements",
    );
  });

  it("jsxToTree throws for unknown client directives on html elements", () => {
    const state = createInitialState("csr");
    const element: JSXElement = {
      type: "JSXElement",
      openingElement: {
        type: "JSXOpeningElement",
        name: { type: "JSXIdentifier", name: "div" },
        attributes: [
          {
            type: "JSXAttribute",
            name: {
              type: "JSXNamespacedName",
              namespace: { type: "JSXIdentifier", name: "client" },
              name: { type: "JSXIdentifier", name: "visibile" },
            },
            value: null,
          },
        ],
        selfClosing: false,
      },
      children: [],
      closingElement: null,
    };

    expect(() => jsxToTree(element, state, nested)).toThrow(
      "Unknown client:* directive",
    );
  });

  it("processAttributes turns load:onClick into metadata attrs plus click event", () => {
    const state = createInitialState("csr");
    const dynamicParts: Parameters<typeof processAttributes>[1] = [];
    const attributes: Parameters<typeof processAttributes>[0] = [
      {
        type: "JSXAttribute",
        name: {
          type: "JSXNamespacedName",
          namespace: { type: "JSXIdentifier", name: "load" },
          name: { type: "JSXIdentifier", name: "onClick" },
        },
        value: expr(nId("handleClick")),
      },
    ];

    const result = processAttributes(attributes, dynamicParts, [0], state, {
      strategy: null,
    });

    expect(result.attrs.type).toBe("ObjectExpression");
    expect(result.events).toEqual([
      {
        type: "click",
        handler: nId("handleClick"),
      },
    ]);
    const objectExpression = result.attrs as {
      properties: Array<{
        key: { type: string; value?: unknown };
        value: { value?: unknown };
      }>;
    };
    expect(
      objectExpression.properties.some(
        (property) =>
          property.key.type === "Literal" &&
          property.key.value === "data-dh-client-target",
      ),
    ).toBe(true);
    expect(
      objectExpression.properties.some(
        (property) =>
          property.key.type === "Literal" &&
          property.key.value === "data-dh-client-strategy" &&
          property.value.value === "load",
      ),
    ).toBe(true);
  });

  it("buildComponentCall throws for invalid media directive values", () => {
    const state = createInitialState("csr");
    const component: JSXElement = {
      type: "JSXElement",
      openingElement: {
        type: "JSXOpeningElement",
        name: { type: "JSXIdentifier", name: "Counter" },
        attributes: [
          {
            type: "JSXAttribute",
            name: {
              type: "JSXNamespacedName",
              namespace: { type: "JSXIdentifier", name: "client" },
              name: { type: "JSXIdentifier", name: "media" },
            },
            value: null,
          },
        ],
        selfClosing: true,
      },
      children: [],
      closingElement: null,
    };

    expect(() => buildComponentCall(component, state, nested)).toThrow(
      "client:media requires a string literal media query",
    );
  });

  it("buildComponentCall throws when valueless directives receive a value", () => {
    const state = createInitialState("csr");
    const component: JSXElement = {
      type: "JSXElement",
      openingElement: {
        type: "JSXOpeningElement",
        name: { type: "JSXIdentifier", name: "Counter" },
        attributes: [
          {
            type: "JSXAttribute",
            name: {
              type: "JSXNamespacedName",
              namespace: { type: "JSXIdentifier", name: "client" },
              name: { type: "JSXIdentifier", name: "visible" },
            },
            value: { type: "Literal", value: "later", raw: '"later"' },
          },
        ],
        selfClosing: true,
      },
      children: [],
      closingElement: null,
    };

    expect(() => buildComponentCall(component, state, nested)).toThrow(
      "client:visible does not accept a value",
    );
  });

  it("buildComponentCall throws for unknown client directives", () => {
    const state = createInitialState("csr");
    const component: JSXElement = {
      type: "JSXElement",
      openingElement: {
        type: "JSXOpeningElement",
        name: { type: "JSXIdentifier", name: "Counter" },
        attributes: [
          {
            type: "JSXAttribute",
            name: {
              type: "JSXNamespacedName",
              namespace: { type: "JSXIdentifier", name: "client" },
              name: { type: "JSXIdentifier", name: "visibile" },
            },
            value: null,
          },
        ],
        selfClosing: true,
      },
      children: [],
      closingElement: null,
    };

    expect(() => buildComponentCall(component, state, nested)).toThrow(
      "Unknown client:* directive",
    );
  });

  it("buildComponentCall throws for explicit reserved metadata collisions", () => {
    const state = createInitialState("csr");
    const component: JSXElement = {
      type: "JSXElement",
      openingElement: {
        type: "JSXOpeningElement",
        name: { type: "JSXIdentifier", name: "Counter" },
        attributes: [
          {
            type: "JSXAttribute",
            name: {
              type: "JSXNamespacedName",
              namespace: { type: "JSXIdentifier", name: "client" },
              name: { type: "JSXIdentifier", name: "visible" },
            },
            value: null,
          },
          {
            type: "JSXAttribute",
            name: { type: "JSXIdentifier", name: "data-dh-island" },
            value: { type: "Literal", value: "manual", raw: '"manual"' },
          },
        ],
        selfClosing: true,
      },
      children: [],
      closingElement: null,
    };

    expect(() => buildComponentCall(component, state, nested)).toThrow(
      "cannot be combined with explicit data-dh-island metadata",
    );
  });
});
