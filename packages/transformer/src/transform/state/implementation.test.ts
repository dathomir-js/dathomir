import { describe, expect, it } from "vitest";

import { createInitialState, createTemplateId } from "./implementation";

describe("transform/state", () => {
  it("createInitialState initializes csr mode state", () => {
    const state = createInitialState("csr");

    expect(state.mode).toBe("csr");
    expect(state.templateCount).toBe(0);
    expect(state.templates).toEqual([]);
    expect(state.runtimeImports.size).toBe(0);
  });

  it("createInitialState initializes ssr mode state", () => {
    const state = createInitialState("ssr");

    expect(state.mode).toBe("ssr");
  });

  it("createTemplateId increments sequentially", () => {
    const state = createInitialState("csr");

    expect(createTemplateId(state).name).toBe("_t1");
    expect(createTemplateId(state).name).toBe("_t2");
    expect(state.templateCount).toBe(2);
  });
});
