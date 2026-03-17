import { describe, expect, it } from "vitest";
import {
  COLOCATED_CLIENT_STRATEGIES,
  DEFAULT_INTERACTION_EVENT_TYPE,
} from "@dathomir/shared";

import { nId, nLit } from "@/transform/ast/implementation";

import {
  getColocatedClientDirective,
  getIslandsDirectiveName,
  getTagName,
  isClientDirectiveNamespace,
  isComponentTag,
  isValidIdentifier,
  jsxNameToExpression,
  normalizeIslandsDirectiveValue,
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

  it("getIslandsDirectiveName detects client directives", () => {
    expect(
      getIslandsDirectiveName({
        type: "JSXNamespacedName",
        namespace: { type: "JSXIdentifier", name: "client" },
        name: { type: "JSXIdentifier", name: "visible" },
      }),
    ).toBe("visible");
  });

  it("isClientDirectiveNamespace detects client namespace", () => {
    expect(
      isClientDirectiveNamespace({
        type: "JSXNamespacedName",
        namespace: { type: "JSXIdentifier", name: "client" },
        name: { type: "JSXIdentifier", name: "idle" },
      }),
    ).toBe(true);
  });

  it("normalizeIslandsDirectiveValue defaults bare client:interaction to click", () => {
    expect(normalizeIslandsDirectiveValue("interaction", null)).toEqual(
      nLit(DEFAULT_INTERACTION_EVENT_TYPE),
    );
  });

  it("getColocatedClientDirective supports all canonical colocated strategies", () => {
    for (const strategy of COLOCATED_CLIENT_STRATEGIES) {
      expect(
        getColocatedClientDirective({
          type: "JSXNamespacedName",
          namespace: { type: "JSXIdentifier", name: strategy },
          name: { type: "JSXIdentifier", name: "onClick" },
        }),
      ).toEqual({ strategy, event: "click" });
    }
  });

  it("normalizeIslandsDirectiveValue throws for invalid directive values", () => {
    expect(() => normalizeIslandsDirectiveValue("media", null)).toThrow(
      "client:media requires a string literal media query",
    );
    expect(() =>
      normalizeIslandsDirectiveValue("visible", {
        type: "Literal",
        value: "soon",
        raw: '"soon"',
      }),
    ).toThrow("client:visible does not accept a value");
  });

  it("isValidIdentifier validates JS identifiers", () => {
    expect(isValidIdentifier("className")).toBe(true);
    expect(isValidIdentifier("data-foo")).toBe(false);
  });
});
