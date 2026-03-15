import { describe, expect, it } from "vitest";

import { createInitialState } from "@/transform/state/implementation";
import type { JSXElement } from "@/transform/jsx/implementation";
import type { NestedTransformers } from "@/transform/tree/implementation";

import { transformJSXForSSRNode } from "./implementation";

const nested: NestedTransformers = {
  transformJSXNode: () => ({
    type: "CallExpression",
    callee: { type: "Identifier", name: "fromTree" },
    arguments: [],
    optional: false,
  }),
  transformJSXForSSRNode,
};

function makeElement(
  children: JSXElement["children"] = [{ type: "JSXText", value: "Hello" }],
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

describe("transform/mode-ssr", () => {
  it("generates empty Map when no dynamic parts exist", () => {
    const state = createInitialState("ssr");
    const output = transformJSXForSSRNode(
      makeElement([{ type: "JSXText", value: "Hello" }]),
      state,
      nested,
    ) as unknown as {
      arguments: Array<{
        type: string;
        callee?: { name: string };
        arguments?: Array<{ type: string; elements: unknown[] }>;
      }>;
    };

    // Third argument should be new Map([])
    expect(output.arguments[2]?.type).toBe("NewExpression");
    expect(output.arguments[2]?.callee?.name).toBe("Map");
    const mapArg = output.arguments[2]?.arguments?.[0] as {
      type: string;
      elements: unknown[];
    };
    expect(mapArg.type).toBe("ArrayExpression");
    expect(mapArg.elements.length).toBe(0);
  });

  it("excludes event dynamic parts from the dynamic Map", () => {
    const state = createInitialState("ssr");
    const output = transformJSXForSSRNode(
      {
        type: "JSXElement",
        openingElement: {
          type: "JSXOpeningElement",
          name: { type: "JSXIdentifier", name: "button" },
          attributes: [
            {
              type: "JSXAttribute",
              name: { type: "JSXIdentifier", name: "onClick" },
              value: {
                type: "JSXExpressionContainer",
                expression: { type: "Identifier", name: "handleClick" },
              },
            },
          ],
          selfClosing: false,
        },
        children: [
          {
            type: "JSXExpressionContainer",
            expression: { type: "Identifier", name: "label" },
          },
        ],
        closingElement: null,
      },
      state,
      nested,
    ) as unknown as {
      arguments: Array<{ type: string; arguments?: unknown[] }>;
    };

    const mapArg = output.arguments[2]?.arguments?.[0] as {
      type: string;
      elements: Array<{ type: string; elements: Array<{ value?: unknown }> }>;
    };
    expect(mapArg.type).toBe("ArrayExpression");
    // Only the text dynamic part (label) should be in the Map, not the event (onClick)
    expect(mapArg.elements.length).toBe(1);
  });

  it("registers renderToString runtime import", () => {
    const state = createInitialState("ssr");
    const output = transformJSXForSSRNode(makeElement(), state, nested);

    expect(output.type).toBe("CallExpression");
    expect(state.runtimeImports.has("renderToString")).toBe(true);
  });

  it("uses Map entries for dynamic parts", () => {
    const state = createInitialState("ssr");
    const output = transformJSXForSSRNode(
      makeElement([
        {
          type: "JSXExpressionContainer",
          expression: { type: "Identifier", name: "name" },
        },
      ]),
      state,
      nested,
    ) as unknown as {
      arguments: Array<{ type: string; arguments?: unknown[] }>;
    };

    expect(output.arguments[2]?.type).toBe("NewExpression");
    const mapArg = output.arguments[2]?.arguments?.[0] as {
      type: string;
      elements: unknown[];
    };
    expect(mapArg.type).toBe("ArrayExpression");
    expect(mapArg.elements.length).toBeGreaterThan(0);
  });

  it("keeps text/insert keys stable even when attr dynamic part appears first", () => {
    const state = createInitialState("ssr");
    const output = transformJSXForSSRNode(
      {
        type: "JSXElement",
        openingElement: {
          type: "JSXOpeningElement",
          name: { type: "JSXIdentifier", name: "div" },
          attributes: [
            {
              type: "JSXAttribute",
              name: { type: "JSXIdentifier", name: "class" },
              value: {
                type: "JSXExpressionContainer",
                expression: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: "state" },
                  property: { type: "Identifier", name: "value" },
                  computed: false,
                  optional: false,
                },
              },
            },
          ],
          selfClosing: false,
        },
        children: [
          {
            type: "JSXExpressionContainer",
            expression: {
              type: "LogicalExpression",
              operator: "&&",
              left: { type: "Identifier", name: "visible" },
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
            },
          },
        ],
        closingElement: null,
      },
      state,
      nested,
    ) as unknown as {
      arguments: Array<{ type: string; arguments?: unknown[] }>;
    };

    const mapArg = output.arguments[2]?.arguments?.[0] as {
      type: string;
      elements: Array<{ type: string; elements: Array<{ value?: unknown }> }>;
    };

    expect(mapArg.type).toBe("ArrayExpression");
    expect(mapArg.elements.length).toBe(2);
    expect(mapArg.elements[0]?.elements[0]?.value).toBe(1);
    expect(mapArg.elements[1]?.elements[0]?.value).toBe(2);
  });
});
