import { describe, expect, it } from "vitest";

import type { JSXElement } from "@/transform/jsx/implementation";
import { createInitialState } from "@/transform/state/implementation";
import type { NestedTransformers } from "@/transform/tree/implementation";

import { transformJSXNode } from "./implementation";

const nested: NestedTransformers = {
  transformJSXNode,
  transformJSXForSSRNode: () => ({
    type: "CallExpression",
    callee: { type: "Identifier", name: "renderToString" },
    arguments: [],
    optional: false,
  }),
};

function makeElement(
  attributes: JSXElement["openingElement"]["attributes"] = [],
): JSXElement {
  return {
    type: "JSXElement",
    openingElement: {
      type: "JSXOpeningElement",
      name: { type: "JSXIdentifier", name: "div" },
      attributes,
      selfClosing: false,
    },
    children: [{ type: "JSXText", value: "Hello" }],
    closingElement: null,
  };
}

describe("transform/mode-csr", () => {
  it("creates template and fromTree import", () => {
    const state = createInitialState("csr");
    const output = transformJSXNode(makeElement(), state, nested);

    expect(output.type).toBe("CallExpression");
    expect(state.templates).toHaveLength(1);
    expect(state.runtimeImports.has("fromTree")).toBe(true);
  });

  it("adds templateEffect for reactive text", () => {
    const state = createInitialState("csr");
    const node = {
      ...makeElement(),
      children: [
        {
          type: "JSXExpressionContainer",
          expression: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "count" },
            property: { type: "Identifier", name: "value" },
            computed: false,
            optional: false,
          },
        },
      ],
    } as JSXElement;

    transformJSXNode(node, state, nested);

    expect(state.runtimeImports.has("templateEffect")).toBe(true);
    expect(state.runtimeImports.has("setText")).toBe(true);
  });

  it("adds event import for event handler attribute", () => {
    const state = createInitialState("csr");
    const node = makeElement([
      {
        type: "JSXAttribute",
        name: { type: "JSXIdentifier", name: "onClick" },
        value: {
          type: "JSXExpressionContainer",
          expression: { type: "Identifier", name: "handler" },
        },
      },
    ]);

    transformJSXNode(node, state, nested);

    expect(state.runtimeImports.has("event")).toBe(true);
  });

  it("initializes static expression attributes with setAttr without templateEffect", () => {
    const state = createInitialState("csr");
    const node = makeElement([
      {
        type: "JSXAttribute",
        name: { type: "JSXIdentifier", name: "data-render-mode" },
        value: {
          type: "JSXExpressionContainer",
          expression: { type: "Identifier", name: "modeLabel" },
        },
      },
    ]);

    const output = transformJSXNode(node, state, nested) as unknown as {
      callee: {
        body: {
          body: Array<{ type: string; expression?: { callee?: { name?: string } } }>;
        };
      };
    };

    const statements = output.callee.body.body;
    expect(state.runtimeImports.has("setAttr")).toBe(true);
    expect(state.runtimeImports.has("templateEffect")).toBe(false);
    expect(
      statements.some(
        (stmt) =>
          stmt.type === "ExpressionStatement" &&
          stmt.expression?.callee?.name === "setAttr",
      ),
    ).toBe(true);
  });

  it("wraps reactive attributes in templateEffect", () => {
    const state = createInitialState("csr");
    const node = makeElement([
      {
        type: "JSXAttribute",
        name: { type: "JSXIdentifier", name: "title" },
        value: {
          type: "JSXExpressionContainer",
          expression: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "count" },
            property: { type: "Identifier", name: "value" },
            computed: false,
            optional: false,
          },
        },
      },
    ]);

    const output = JSON.stringify(transformJSXNode(node, state, nested));

    expect(state.runtimeImports.has("templateEffect")).toBe(true);
    expect(state.runtimeImports.has("setAttr")).toBe(true);
    expect(output).toContain('"name":"setAttr"');
  });

  it("does not wrap component inserts in templateEffect", () => {
    const state = createInitialState("csr");
    const node = {
      ...makeElement(),
      children: [
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
      ],
    } as JSXElement;

    const output = JSON.stringify(transformJSXNode(node, state, nested));

    expect(state.runtimeImports.has("templateEffect")).toBe(false);
    expect(output).not.toContain('"name":"templateEffect"');
  });

  it("wraps dynamic inserts in templateEffect", () => {
    const state = createInitialState("csr");
    const node = {
      ...makeElement(),
      children: [
        {
          type: "JSXExpressionContainer",
          expression: {
            type: "LogicalExpression",
            operator: "&&",
            left: { type: "Literal", value: true, raw: "true" },
            right: {
              type: "JSXElement",
              openingElement: {
                type: "JSXOpeningElement",
                name: { type: "JSXIdentifier", name: "span" },
                attributes: [],
                selfClosing: false,
              },
              children: [{ type: "JSXText", value: "A" }],
              closingElement: null,
            },
          },
        },
      ],
    } as JSXElement;

    const output = JSON.stringify(transformJSXNode(node, state, nested));

    expect(state.runtimeImports.has("insert")).toBe(true);
    expect(state.runtimeImports.has("templateEffect")).toBe(true);
    expect(output).toContain('"name":"templateEffect"');
    expect(output).toContain('"name":"insert"');
  });

  it("wraps spread attributes in templateEffect", () => {
    const state = createInitialState("csr");
    const node = makeElement([
      {
        type: "JSXSpreadAttribute",
        argument: { type: "Identifier", name: "props" },
      } as never,
    ]);

    const output = JSON.stringify(transformJSXNode(node, state, nested));

    expect(state.runtimeImports.has("spread")).toBe(true);
    expect(state.runtimeImports.has("templateEffect")).toBe(true);
    expect(output).toContain('"name":"spread"');
  });

  it("declares insert anchors before templateEffect expressions", () => {
    const state = createInitialState("csr");
    const node = {
      ...makeElement(),
      children: [
        {
          type: "JSXExpressionContainer",
          expression: {
            type: "LogicalExpression",
            operator: "&&",
            left: { type: "Literal", value: true, raw: "true" },
            right: {
              type: "JSXElement",
              openingElement: {
                type: "JSXOpeningElement",
                name: { type: "JSXIdentifier", name: "span" },
                attributes: [],
                selfClosing: false,
              },
              children: [{ type: "JSXText", value: "A" }],
              closingElement: null,
            },
          },
        },
        {
          type: "JSXExpressionContainer",
          expression: {
            type: "ObjectExpression",
            properties: [
              {
                type: "Property",
                key: { type: "Identifier", name: "node" },
                value: {
                  type: "JSXElement",
                  openingElement: {
                    type: "JSXOpeningElement",
                    name: { type: "JSXIdentifier", name: "em" },
                    attributes: [],
                    selfClosing: false,
                  },
                  children: [{ type: "JSXText", value: "B" }],
                  closingElement: null,
                },
                kind: "init",
                computed: false,
                method: false,
                shorthand: false,
              },
            ],
          },
        },
      ],
    } as JSXElement;

    const output = transformJSXNode(node, state, nested) as unknown as {
      callee: {
        body: {
          body: Array<{
            type: string;
            declarations?: Array<{ id: { name: string } }>;
          }>;
        };
      };
    };

    const statements = output.callee.body.body;
    const firstTemplateEffectIndex = statements.findIndex(
      (stmt) =>
        stmt.type === "ExpressionStatement" &&
        (stmt as unknown as { expression?: { callee?: { name?: string } } })
          .expression?.callee?.name === "templateEffect",
    );
    const insertNodeDeclarationIndexes = statements
      .map((stmt, index) => ({
        index,
        name:
          stmt.type === "VariableDeclaration"
            ? (stmt.declarations?.[0]?.id.name ?? "")
            : "",
      }))
      .filter(({ name }) => name.startsWith("_n0_"));

    expect(firstTemplateEffectIndex).toBeGreaterThan(-1);
    expect(insertNodeDeclarationIndexes.length).toBeGreaterThanOrEqual(2);
    expect(
      insertNodeDeclarationIndexes.every(
        ({ index }) => index < firstTemplateEffectIndex,
      ),
    ).toBe(true);
  });
});
