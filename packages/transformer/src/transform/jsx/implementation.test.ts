import { describe, expect, it } from "vitest";

import { nId } from "@/transform/ast/implementation";

import {
  getTagName,
  isComponentTag,
  isValidIdentifier,
  jsxNameToExpression,
} from "./implementation";

describe("transform/jsx", () => {
  it("isComponentTag returns true for uppercase identifiers", () => {
    expect(isComponentTag({ type: "JSXIdentifier", name: "Counter" })).toBe(
      true,
    );
  });

  it("isComponentTag returns false for lowercase html tags", () => {
    expect(isComponentTag({ type: "JSXIdentifier", name: "div" })).toBe(false);
  });

  it("isComponentTag returns true for JSXMemberExpression", () => {
    expect(
      isComponentTag({
        type: "JSXMemberExpression",
        object: { type: "JSXIdentifier", name: "Foo" },
        property: { type: "JSXIdentifier", name: "Bar" },
      }),
    ).toBe(true);
  });

  it("jsxNameToExpression converts member names to MemberExpression", () => {
    const expr = jsxNameToExpression({
      type: "JSXMemberExpression",
      object: { type: "JSXIdentifier", name: "Foo" },
      property: { type: "JSXIdentifier", name: "Bar" },
    });

    expect(expr.type).toBe("MemberExpression");
  });

  it("jsxNameToExpression converts namespaced names to identifier", () => {
    const expr = jsxNameToExpression({
      type: "JSXNamespacedName",
      namespace: { type: "JSXIdentifier", name: "svg" },
      name: { type: "JSXIdentifier", name: "path" },
    });

    expect(expr).toEqual(nId("svg_path"));
  });

  it("getTagName returns dotted path for member names", () => {
    const name = getTagName({
      type: "JSXMemberExpression",
      object: {
        type: "JSXMemberExpression",
        object: { type: "JSXIdentifier", name: "A" },
        property: { type: "JSXIdentifier", name: "B" },
      },
      property: { type: "JSXIdentifier", name: "C" },
    });

    expect(name).toBe("A.B.C");
  });

  it("isValidIdentifier validates JS identifiers", () => {
    expect(isValidIdentifier("className")).toBe(true);
    expect(isValidIdentifier("data-foo")).toBe(false);
  });
});
