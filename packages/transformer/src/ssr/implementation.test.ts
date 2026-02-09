/**
 * Tests for SSR mode transformation.
 */

import { describe, expect, it } from "vitest";

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
});
