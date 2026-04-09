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
  it("returns a static string literal when no dynamic parts exist", () => {
    const state = createInitialState("ssr");
    const output = transformJSXForSSRNode(
      makeElement([{ type: "JSXText", value: "Hello" }]),
      state,
      nested,
    ) as unknown as { type: string; value?: unknown };

    expect(output.type).toBe("Literal");
    expect(output.value).toBe("<div>Hello</div>");
  });

  it("excludes event dynamic parts from compiled SSR output", () => {
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
    );

    expect(JSON.stringify(output)).toContain('"name":"renderDynamicText"');
    expect(JSON.stringify(output)).not.toContain("handleClick");
  });

  it("registers compiled SSR helper imports", () => {
    const state = createInitialState("ssr");
    const output = transformJSXForSSRNode(makeElement(), state, nested);

    expect(output.type).toBe("Literal");
    expect(state.runtimeImports.has("renderDynamicText")).toBe(false);
  });

  it("uses helper calls for dynamic parts", () => {
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
    );

    expect(JSON.stringify(output)).toContain('"name":"renderDynamicText"');
  });

  it("keeps text/insert marker ids stable even when attr dynamic part appears first", () => {
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
    );

    const serialized = JSON.stringify(output);
    expect(serialized).toContain("<!--dh:i:1-->");
    expect(serialized).toContain('"name":"renderDynamicAttr"');
  });

  it("falls back to renderToString for custom elements", () => {
    const state = createInitialState("ssr");
    const output = transformJSXForSSRNode(
      {
        type: "JSXElement",
        openingElement: {
          type: "JSXOpeningElement",
          name: { type: "JSXIdentifier", name: "my-widget" },
          attributes: [],
          selfClosing: false,
        },
        children: [{ type: "JSXText", value: "Hello" }],
        closingElement: null,
      },
      state,
      nested,
    ) as unknown as { callee?: { name?: string } };

    expect(output.callee?.name).toBe("renderToString");
    expect(state.runtimeImports.has("renderToString")).toBe(true);
  });
});
