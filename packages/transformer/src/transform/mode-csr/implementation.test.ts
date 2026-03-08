import { describe, expect, it } from "vitest";

import { createInitialState } from "@/transform/state/implementation";
import type { JSXElement } from "@/transform/jsx/implementation";
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

function makeElement(attributes: JSXElement["openingElement"]["attributes"] = []): JSXElement {
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
});
