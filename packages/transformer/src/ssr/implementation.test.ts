/**
 * Tests for SSR mode transformation.
 */

import { describe, expect, it } from "vitest";

import {
  generateSSRRender,
  generateStateObject,
  isSSRImport,
  SSR_IMPORTS,
} from "./implementation";
import { transform } from "../transform/implementation";

// ---------------------------------------------------------------------------
// Minimal ESTree node types used in tests
// ---------------------------------------------------------------------------

interface ESTNode {
  type: string;
  [key: string]: unknown;
}

interface CallExpression extends ESTNode {
  type: "CallExpression";
  callee: ESTNode;
  arguments: ESTNode[];
}

interface NewExpression extends ESTNode {
  type: "NewExpression";
  callee: ESTNode;
  arguments: ESTNode[];
}

interface ArrayExpression extends ESTNode {
  type: "ArrayExpression";
  elements: (ESTNode | null)[];
}

interface ObjectExpression extends ESTNode {
  type: "ObjectExpression";
  properties: ESTNode[];
}

interface Property extends ESTNode {
  type: "Property";
  key: ESTNode;
  value: ESTNode;
}

interface Identifier extends ESTNode {
  type: "Identifier";
  name: string;
}

interface Literal extends ESTNode {
  type: "Literal";
  value: string | number | boolean | null;
  raw: string;
}

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

  it("inserts SSR markers for dynamic text content", () => {
    const code = `const element = <div>{name}</div>;`;
    const result = transform(code, { mode: "ssr" });

    // The tree should contain a {text} marker placeholder for the dynamic text child
    expect(result.code).toContain("{text}");
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
    const nonSsrImports = [
      "fromTree",
      "setText",
      "setAttr",
      "event",
      "insert",
      "templateEffect",
    ];
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
    const tree: ESTNode = {
      type: "ArrayExpression",
      elements: [
        { type: "Literal", value: "div", raw: '"div"' },
        { type: "Literal", value: null, raw: "null" },
      ],
    };
    const result = generateSSRRender(tree, [], null);

    expect(result.type).toBe("CallExpression");
    const call = result as CallExpression;
    expect(call.callee.type).toBe("Identifier");
    expect((call.callee as Identifier).name).toBe("renderToString");
    // Third argument should be new Map([])
    expect(call.arguments[2]?.type).toBe("NewExpression");
  });

  it("generates renderToString call with indexed Map entries for dynamic values", () => {
    const tree: ESTNode = {
      type: "ArrayExpression",
      elements: [
        { type: "Literal", value: "div", raw: '"div"' },
        { type: "Literal", value: null, raw: "null" },
      ],
    };
    const val1: ESTNode = { type: "Literal", value: "hello", raw: '"hello"' };
    const val2: ESTNode = { type: "Literal", value: 42, raw: "42" };
    const result = generateSSRRender(tree, [val1, val2], null);

    expect(result.type).toBe("CallExpression");
    const call = result as CallExpression;
    const mapExpr = call.arguments[2] as NewExpression;
    expect(mapExpr.type).toBe("NewExpression");
    // Map constructor receives an ArrayExpression of entries
    const entries = (mapExpr.arguments[0] as ArrayExpression).elements;
    expect(entries).toHaveLength(2);
    // First entry: [1, val1]
    const first = entries[0] as ArrayExpression;
    expect((first.elements[0] as Literal).value).toBe(1);
    // Second entry: [2, val2]
    const second = entries[1] as ArrayExpression;
    expect((second.elements[0] as Literal).value).toBe(2);
  });

  it("uses empty object as state when stateExpr is null", () => {
    const tree: ESTNode = { type: "ArrayExpression", elements: [] };
    const result = generateSSRRender(tree, [], null);

    const call = result as CallExpression;
    // Second argument (state) should be an empty object expression
    expect(call.arguments[1]?.type).toBe("ObjectExpression");
    const stateArg = call.arguments[1] as ObjectExpression;
    expect(stateArg.properties).toHaveLength(0);
  });

  it("uses provided stateExpr as state argument", () => {
    const tree: ESTNode = { type: "ArrayExpression", elements: [] };
    const stateExpr: ESTNode = {
      type: "ObjectExpression",
      properties: [
        {
          type: "Property",
          key: { type: "Identifier", name: "count" },
          value: { type: "Literal", value: 0, raw: "0" },
          kind: "init",
          computed: false,
          method: false,
          shorthand: false,
        },
      ],
    };
    const result = generateSSRRender(tree, [], stateExpr);

    const call = result as CallExpression;
    // Second argument (state) should be the provided expression (same reference)
    expect(call.arguments[1]).toBe(stateExpr);
  });

  it("returns a CallExpression with callee name renderToString", () => {
    const tree: ESTNode = { type: "ArrayExpression", elements: [] };
    const result = generateSSRRender(tree, [], null);

    expect(result.type).toBe("CallExpression");
    const call = result as CallExpression;
    expect(call.callee.type).toBe("Identifier");
    expect((call.callee as Identifier).name).toBe("renderToString");
  });
});

describe("generateStateObject", () => {
  it("returns an empty ObjectExpression when signals Map is empty", () => {
    const result = generateStateObject(new Map());

    expect(result.type).toBe("ObjectExpression");
    const obj = result as ObjectExpression;
    expect(obj.properties).toHaveLength(0);
  });

  it("returns ObjectExpression with properties for each signal entry", () => {
    const val1: ESTNode = { type: "Literal", value: 0, raw: "0" };
    const val2: ESTNode = { type: "Literal", value: "Alice", raw: '"Alice"' };
    const signals = new Map<string, ESTNode>([
      ["count", val1],
      ["name", val2],
    ]);
    const result = generateStateObject(signals);

    expect(result.type).toBe("ObjectExpression");
    const obj = result as ObjectExpression;
    expect(obj.properties).toHaveLength(2);

    // Verify property names
    const propNames = obj.properties.map(
      (p) => ((p as Property).key as Identifier).name,
    );
    expect(propNames).toContain("count");
    expect(propNames).toContain("name");
  });

  it("composes with generateSSRRender to produce state in renderToString call", () => {
    const signals = new Map<string, ESTNode>([
      ["count", { type: "Literal", value: 0, raw: "0" }],
    ]);
    const stateExpr = generateStateObject(signals);
    const tree: ESTNode = { type: "ArrayExpression", elements: [] };
    const result = generateSSRRender(tree, [], stateExpr);

    const call = result as CallExpression;
    // Second argument (state) should be the ObjectExpression from generateStateObject
    expect(call.arguments[1]?.type).toBe("ObjectExpression");
    const stateArg = call.arguments[1] as ObjectExpression;
    expect(stateArg.properties).toHaveLength(1);
    const prop = stateArg.properties[0] as Property;
    expect((prop.key as Identifier).name).toBe("count");
  });
});
