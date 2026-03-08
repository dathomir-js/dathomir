import { describe, expect, it } from "vitest";

import { nId } from "@/transform/ast/implementation";
import { createInitialState } from "@/transform/state/implementation";

import { generateNavigation } from "./implementation";

describe("transform/navigation", () => {
  it("generates firstChild navigation for root path", () => {
    const state = createInitialState("csr");
    const expr = generateNavigation(nId("_f"), [0], state);

    expect(expr.type).toBe("CallExpression");
    expect(state.runtimeImports.has("firstChild")).toBe(true);
  });

  it("generates nextSibling chain for sibling index", () => {
    const state = createInitialState("csr");
    const expr = generateNavigation(nId("_f"), [2], state) as {
      type: string;
      callee: { type: string; name: string };
      arguments: unknown[];
    };

    expect(expr.type).toBe("CallExpression");
    expect(expr.callee.name).toBe("nextSibling");
    expect(state.runtimeImports.has("nextSibling")).toBe(true);
  });

  it("generates nested firstChild and nextSibling navigation", () => {
    const state = createInitialState("csr");
    const expr = generateNavigation(nId("_f"), [0, 1], state) as {
      type: string;
      callee: { type: string; name: string };
      arguments: unknown[];
    };

    expect(expr.type).toBe("CallExpression");
    expect(expr.callee.name).toBe("nextSibling");
    expect(state.runtimeImports.has("firstChild")).toBe(true);
    expect(state.runtimeImports.has("nextSibling")).toBe(true);
  });
});
