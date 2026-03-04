/**
 * Tests for SSR mode transformation.
 */

import * as t from "@babel/types";
import { describe, expect, it } from "vitest";

import {
  generateSSRRender,
  generateStateObject,
  isSSRImport,
  SSR_IMPORTS,
} from "./implementation";
import { transform } from "../transform/implementation";

describe("SSR Mode Transformation", () => {
  it("generates renderToString import in SSR mode", () => {
    const code = `const element = <div>Hello</div>;`;
    const result = transform(code, { mode: "ssr" });

    expect(result.code).toContain("renderToString");
  });

  it("generates different output for SSR vs CSR", () => {
    const code = `const element = <div>Hello</div>;`;

    const csrResult = transform(code, { mode: "csr" });
    const ssrResult = transform(code, { mode: "ssr" });

    // CSR should use fromTree
    expect(csrResult.code).toContain("fromTree");

    // SSR should use renderToString
    expect(ssrResult.code).toContain("renderToString");
  });

  it("handles dynamic text in SSR mode", () => {
    const code = `
      const name = "World";
      const element = <div>Hello {name}</div>;
    `;
    const result = transform(code, { mode: "ssr" });

    expect(result.code).toContain("renderToString");
    expect(result.code).toContain("Map");
  });

  it("handles attributes in SSR mode", () => {
    const code = `const element = <div class="container">Content</div>;`;
    const result = transform(code, { mode: "ssr" });

    expect(result.code).toContain("renderToString");
    expect(result.code).toContain("container");
  });

  it("handles nested elements in SSR mode", () => {
    const code = `
      const element = (
        <div>
          <span>Nested</span>
          <p>Paragraph</p>
        </div>
      );
    `;
    const result = transform(code, { mode: "ssr" });

    expect(result.code).toContain("renderToString");
    expect(result.code).toContain("div");
    expect(result.code).toContain("span");
    expect(result.code).toContain("p");
  });

  it("defaults to CSR mode when not specified", () => {
    const code = `const element = <div>Hello</div>;`;
    const result = transform(code, {});

    expect(result.code).toContain("fromTree");
    expect(result.code).not.toContain("renderToString");
  });

  it("handles Fragment in SSR mode", () => {
    const code = `
      const element = (
        <>
          <div>First</div>
          <span>Second</span>
        </>
      );
    `;
    const result = transform(code, { mode: "ssr" });

    expect(result.code).toContain("renderToString");
    expect(result.code).toContain("div");
    expect(result.code).toContain("span");
  });
});

describe("isSSRImport", () => {
  it("returns true for all SSR-specific import names", () => {
    for (const name of SSR_IMPORTS) {
      expect(isSSRImport(name)).toBe(true);
    }
  });

  it("returns true for renderToString", () => {
    expect(isSSRImport("renderToString")).toBe(true);
  });

  it("returns true for renderTree", () => {
    expect(isSSRImport("renderTree")).toBe(true);
  });

  it("returns true for serializeState", () => {
    expect(isSSRImport("serializeState")).toBe(true);
  });

  it("returns true for createMarker", () => {
    expect(isSSRImport("createMarker")).toBe(true);
  });

  it("returns true for MarkerType", () => {
    expect(isSSRImport("MarkerType")).toBe(true);
  });

  it("returns false for non-SSR import names", () => {
    const nonSsrImports = ["fromTree", "setText", "setAttr", "event", "insert", "templateEffect"];
    for (const name of nonSsrImports) {
      expect(isSSRImport(name)).toBe(false);
    }
  });

  it("returns false for empty string", () => {
    expect(isSSRImport("")).toBe(false);
  });
});

describe("generateSSRRender", () => {
  it("generates renderToString call with empty Map when no dynamic values", () => {
    const tree = t.arrayExpression([t.stringLiteral("div"), t.nullLiteral()]);
    const result = generateSSRRender(tree, [], null);

    expect(t.isCallExpression(result)).toBe(true);
    const call = result as t.CallExpression;
    expect(t.isIdentifier(call.callee, { name: "renderToString" })).toBe(true);
    // Third argument should be new Map([])
    expect(t.isNewExpression(call.arguments[2])).toBe(true);
  });

  it("generates renderToString call with indexed Map entries for dynamic values", () => {
    const tree = t.arrayExpression([t.stringLiteral("div"), t.nullLiteral()]);
    const val1 = t.stringLiteral("hello");
    const val2 = t.numericLiteral(42);
    const result = generateSSRRender(tree, [val1, val2], null);

    expect(t.isCallExpression(result)).toBe(true);
    const call = result as t.CallExpression;
    const mapExpr = call.arguments[2] as t.NewExpression;
    expect(t.isNewExpression(mapExpr)).toBe(true);
    // Map should have 2 entries
    const entries = (mapExpr.arguments[0] as t.ArrayExpression).elements;
    expect(entries).toHaveLength(2);
    // First entry: [1, val1]
    const first = entries[0] as t.ArrayExpression;
    expect((first.elements[0] as t.NumericLiteral).value).toBe(1);
    // Second entry: [2, val2]
    const second = entries[1] as t.ArrayExpression;
    expect((second.elements[0] as t.NumericLiteral).value).toBe(2);
  });

  it("uses empty object as state when stateExpr is null", () => {
    const tree = t.arrayExpression([]);
    const result = generateSSRRender(tree, [], null);

    const call = result as t.CallExpression;
    // Second argument (state) should be an empty object expression
    expect(t.isObjectExpression(call.arguments[1])).toBe(true);
    const stateArg = call.arguments[1] as t.ObjectExpression;
    expect(stateArg.properties).toHaveLength(0);
  });

  it("uses provided stateExpr as state argument", () => {
    const tree = t.arrayExpression([]);
    const stateExpr = t.objectExpression([
      t.objectProperty(t.identifier("count"), t.numericLiteral(0)),
    ]);
    const result = generateSSRRender(tree, [], stateExpr);

    const call = result as t.CallExpression;
    // Second argument (state) should be the provided expression
    expect(call.arguments[1]).toBe(stateExpr);
  });

  it("returns a CallExpression with callee name renderToString", () => {
    const tree = t.arrayExpression([]);
    const result = generateSSRRender(tree, [], null);

    expect(t.isCallExpression(result)).toBe(true);
    const call = result as t.CallExpression;
    expect(t.isIdentifier(call.callee)).toBe(true);
    expect((call.callee as t.Identifier).name).toBe("renderToString");
  });
});

describe("generateStateObject", () => {
  it("returns an empty ObjectExpression when signals Map is empty", () => {
    const result = generateStateObject(new Map());

    expect(t.isObjectExpression(result)).toBe(true);
    const obj = result as t.ObjectExpression;
    expect(obj.properties).toHaveLength(0);
  });

  it("returns ObjectExpression with properties for each signal entry", () => {
    const signals = new Map<string, t.Expression>([
      ["count", t.numericLiteral(0)],
      ["name", t.stringLiteral("Alice")],
    ]);
    const result = generateStateObject(signals);

    expect(t.isObjectExpression(result)).toBe(true);
    const obj = result as t.ObjectExpression;
    expect(obj.properties).toHaveLength(2);

    // Verify property names
    const propNames = obj.properties.map(
      (p) => ((p as t.ObjectProperty).key as t.Identifier).name,
    );
    expect(propNames).toContain("count");
    expect(propNames).toContain("name");
  });
});
