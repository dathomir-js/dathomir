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

function makeElement(children: JSXElement["children"] = [{ type: "JSXText", value: "Hello" }]): JSXElement {
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
    const mapArg = output.arguments[2]?.arguments?.[0] as { type: string; elements: unknown[] };
    expect(mapArg.type).toBe("ArrayExpression");
    expect(mapArg.elements.length).toBeGreaterThan(0);
  });
});
