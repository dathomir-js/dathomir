import { describe, expect, it, vi } from "vitest";

import { transform } from "@dathomir/transformer";

vi.mock("@dathomir/transformer", () => ({
  transform: vi.fn(() => ({
    code: "transformed",
    map: '{"version":3}',
  })),
}));

/**
 * Plugin internal helpers are not directly exported,
 * so we test via the exported plugin factories.
 */
import {
  dathomir,
  dathomirEsbuildPlugin,
  dathomirRollupPlugin,
  dathomirVitePlugin,
  dathomirWebpackPlugin,
} from "./implementation";

describe("plugin", () => {
  describe("exports", () => {
    it("should export dathomir unplugin factory", () => {
      expect(dathomir).toBeDefined();
    });

    it("should export dathomirVitePlugin", () => {
      expect(dathomirVitePlugin).toBeDefined();
      expect(typeof dathomirVitePlugin).toBe("function");
    });

    it("should export dathomirWebpackPlugin", () => {
      expect(dathomirWebpackPlugin).toBeDefined();
    });

    it("should export dathomirRollupPlugin", () => {
      expect(dathomirRollupPlugin).toBeDefined();
    });

    it("should export dathomirEsbuildPlugin", () => {
      expect(dathomirEsbuildPlugin).toBeDefined();
    });
  });

  describe("dathomirVitePlugin", () => {
    it("should create a Vite plugin with correct name", () => {
      const plugin = dathomirVitePlugin();
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe("dathomir");
    });

    it("should set enforce to pre", () => {
      const plugin = dathomirVitePlugin();
      expect(plugin.enforce).toBe("pre");
    });

    it("should have a transform function", () => {
      const plugin = dathomirVitePlugin();
      expect(typeof plugin.transform).toBe("function");
    });

    it("should transform TSX files", () => {
      const plugin = dathomirVitePlugin();
      const result = (plugin.transform as Function)(
        "const x = <div />;",
        "component.tsx",
        {},
      );

      expect(transform).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.code).toBe("transformed");
    });

    it("should transform JSX files", () => {
      const plugin = dathomirVitePlugin();
      const result = (plugin.transform as Function)(
        "const x = <div />;",
        "component.jsx",
        {},
      );

      expect(transform).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should skip non-JSX/TSX files", () => {
      const plugin = dathomirVitePlugin();
      const result = (plugin.transform as Function)(
        "const x = 1;",
        "module.ts",
        {},
      );

      expect(result).toBeNull();
    });

    it("should skip excluded files", () => {
      const plugin = dathomirVitePlugin({
        exclude: ["node_modules"],
      });
      const result = (plugin.transform as Function)(
        "const x = <div />;",
        "node_modules/lib/component.tsx",
        {},
      );

      expect(result).toBeNull();
    });

    it("should respect custom include extensions", () => {
      const plugin = dathomirVitePlugin({
        include: [".tsx"],
      });

      const tsxResult = (plugin.transform as Function)(
        "const x = <div />;",
        "component.tsx",
        {},
      );
      expect(tsxResult).toBeDefined();
      expect(tsxResult).not.toBeNull();

      const jsxResult = (plugin.transform as Function)(
        "const x = <div />;",
        "component.jsx",
        {},
      );
      expect(jsxResult).toBeNull();
    });

    it("should pass SSR flag from Vite transform options", () => {
      const plugin = dathomirVitePlugin();
      (plugin.transform as Function)("const x = <div />;", "component.tsx", {
        ssr: true,
      });

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ mode: "ssr" }),
      );
    });

    it("should default to CSR mode", () => {
      const plugin = dathomirVitePlugin();
      (plugin.transform as Function)("const x = <div />;", "component.tsx", {});

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ mode: "csr" }),
      );
    });

    it("should use forced mode over SSR flag", () => {
      const plugin = dathomirVitePlugin({ mode: "ssr" });
      (plugin.transform as Function)("const x = <div />;", "component.tsx", {});

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ mode: "ssr" }),
      );
    });
  });
});
