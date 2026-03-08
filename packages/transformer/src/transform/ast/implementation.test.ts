import { describe, expect, it } from "vitest";

import {
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isStringLiteral,
  isVariableDeclaration,
  nArr,
  nCall,
  nConst,
  nId,
  nLit,
  nProp,
} from "./implementation";

describe("transform/ast", () => {
  it("nLit creates string literal with quoted raw", () => {
    const node = nLit("hello");

    expect(node.type).toBe("Literal");
    expect(node.value).toBe("hello");
    expect(node.raw).toBe('"hello"');
  });

  it("nLit creates numeric and null literals", () => {
    const n = nLit(42);
    const z = nLit(null);

    expect(n.raw).toBe("42");
    expect(z.raw).toBe("null");
  });

  it("nCall creates call expression with optional false", () => {
    const call = nCall(nId("fn"), [nLit(1)]);

    expect(call.type).toBe("CallExpression");
    expect(call.optional).toBe(false);
    expect(call.arguments).toHaveLength(1);
  });

  it("nProp creates init property", () => {
    const prop = nProp(nId("key"), nLit("value"));

    expect(prop.type).toBe("Property");
    expect(prop.kind).toBe("init");
    expect(prop.computed).toBe(false);
  });

  it("type guards identify nodes correctly", () => {
    const call = nCall(nId("fn"), []);
    const id = nId("x");
    const member = {
      type: "MemberExpression",
      object: id,
      property: nId("value"),
      computed: false,
      optional: false,
    };
    const decl = nConst(nId("x"), nArr([]));

    expect(isCallExpression(call)).toBe(true);
    expect(isIdentifier(id)).toBe(true);
    expect(isMemberExpression(member)).toBe(true);
    expect(isVariableDeclaration(decl)).toBe(true);
    expect(isStringLiteral(nLit("ok"))).toBe(true);
    expect(isStringLiteral(nLit(1))).toBe(false);
  });
});
