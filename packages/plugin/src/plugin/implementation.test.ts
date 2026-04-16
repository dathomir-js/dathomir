import path from "node:path";
import { fileURLToPath } from "node:url";
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

const actualTransformer = await vi.importActual<
  typeof import("@dathomir/transformer")
>("@dathomir/transformer");

type RollupLikePlugin = {
  transformInclude: (id: string) => boolean;
  transform: (
    this: { environment?: { name: string } },
    code: string,
    id: string,
  ) => PluginTransformOutput | null;
};

type PluginTransformOutput = {
  code: string;
  map?: unknown;
};

type ViteTransformHook = (
  this: { environment?: { name: string } },
  code: string,
  id: string,
  transformOptions?: { ssr?: boolean },
) => PluginTransformOutput | null;

type ViteResolveIdHook = (
  this: unknown,
  source: string,
  importer?: string,
) => string | null | Promise<string | null>;

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

function requireTransformResult(
  result: PluginTransformOutput | null,
): PluginTransformOutput {
  if (result === null) {
    throw new Error("Expected plugin transform to return a result");
  }

  return result;
}

function invokeViteTransform(
  plugin: ReturnType<typeof dathomirVitePlugin>,
  code: string,
  id: string,
  transformOptions: { ssr?: boolean } = {},
  context: { environment?: { name: string } } = {},
): PluginTransformOutput | null {
  const transformHook = plugin.transform as ViteTransformHook;
  return transformHook.call(context, code, id, transformOptions);
}

async function invokeResolveId(
  plugin: ReturnType<typeof dathomirVitePlugin>,
  source: string,
  importer?: string,
): Promise<string | null> {
  const resolveId = plugin.resolveId as ViteResolveIdHook;
  return await resolveId.call({}, source, importer);
}

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
      const result = requireTransformResult(
        invokeViteTransform(plugin, "const x = <div />;", "component.tsx", {}),
      );

      expect(transform).toHaveBeenCalled();
      expect(result.code).toBe("transformed");
    });

    it("should transform JSX files", () => {
      const plugin = dathomirVitePlugin();
      const result = invokeViteTransform(
        plugin,
        "const x = <div />;",
        "component.jsx",
        {},
      );

      expect(transform).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should skip non-JSX/TSX files", () => {
      const plugin = dathomirVitePlugin();
      const result = invokeViteTransform(
        plugin,
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
      const result = invokeViteTransform(
        plugin,
        "const x = <div />;",
        "node_modules/lib/component.tsx",
        {},
      );

      expect(result).toBeNull();
    });

    it("should transform files that do not match the exclude pattern", () => {
      const plugin = dathomirVitePlugin({
        exclude: ["node_modules"],
      });
      const result = requireTransformResult(
        invokeViteTransform(
          plugin,
          "const x = <div />;",
          "src/component.tsx",
          {},
        ),
      );

      expect(result.code).toBe("transformed");
    });

    it("should respect custom include extensions", () => {
      const plugin = dathomirVitePlugin({
        include: [".tsx"],
      });

      const tsxResult = invokeViteTransform(
        plugin,
        "const x = <div />;",
        "component.tsx",
        {},
      );
      expect(tsxResult).toBeDefined();
      expect(tsxResult).not.toBeNull();

      const jsxResult = invokeViteTransform(
        plugin,
        "const x = <div />;",
        "component.jsx",
        {},
      );
      expect(jsxResult).toBeNull();
    });

    it("should pass SSR flag from Vite transform options", () => {
      const plugin = dathomirVitePlugin();
      invokeViteTransform(plugin, "const x = <div />;", "component.tsx", {
        ssr: true,
      });

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ mode: "ssr" }),
      );
    });

    it("should default to CSR mode", () => {
      const plugin = dathomirVitePlugin();
      invokeViteTransform(plugin, "const x = <div />;", "component.tsx", {});

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ mode: "csr" }),
      );
    });

    it("should use forced mode over SSR flag", () => {
      const plugin = dathomirVitePlugin({ mode: "ssr" });
      invokeViteTransform(plugin, "const x = <div />;", "component.tsx", {});

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ mode: "ssr" }),
      );
    });

    it("should pass custom runtimeModule to transformer", () => {
      const plugin = dathomirVitePlugin({ runtimeModule: "custom-runtime" });
      invokeViteTransform(plugin, "const x = <div />;", "component.tsx", {});

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ runtimeModule: "custom-runtime" }),
      );
    });

    it("should pass filename to transformer", () => {
      const plugin = dathomirVitePlugin();
      invokeViteTransform(
        plugin,
        "const x = <div />;",
        "/path/to/component.tsx",
        {},
      );

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ filename: "/path/to/component.tsx" }),
      );
    });

    it("should wrap transform errors with filename", () => {
      vi.mocked(transform).mockImplementationOnce(() => {
        throw new Error("Parse error");
      });

      const plugin = dathomirVitePlugin();

      expect(() => {
        invokeViteTransform(
          plugin,
          "const x = <div />;",
          "/path/to/component.tsx",
          {},
        );
      }).toThrow("[dathomir] Error transforming /path/to/component.tsx");
    });

    it("should rethrow non-Error objects as-is", () => {
      const nonErrorThrow = "string error" as unknown as Error;
      vi.mocked(transform).mockImplementationOnce(() => {
        // eslint-disable-next-line no-throw-literal -- intentional coverage for passthrough behavior
        throw nonErrorThrow;
      });

      const plugin = dathomirVitePlugin();

      expect(() => {
        invokeViteTransform(plugin, "const x = <div />;", "component.tsx", {});
      }).toThrow(nonErrorThrow);
    });

    it("should return undefined map when transformer returns no source map", () => {
      vi.mocked(transform).mockImplementationOnce(() => ({
        code: "transformed",
        map: undefined,
      }));

      const plugin = dathomirVitePlugin();
      const result = requireTransformResult(
        invokeViteTransform(plugin, "const x = <div />;", "component.tsx", {}),
      );

      expect(result.map).toBeUndefined();
    });

    it("should preserve the islands metadata contract through real transformer output", () => {
      vi.mocked(transform).mockImplementation(actualTransformer.transform);

      const plugin = dathomirVitePlugin();
      const result = requireTransformResult(
        invokeViteTransform(
          plugin,
          'const island = <Counter client:interaction="mouseenter" />; const button = <button visible:onClick={() => doThing()}>Run</button>;',
          "component.tsx",
          {},
        ),
      );

      expect(result.code).toContain('"data-dh-island": "interaction"');
      expect(result.code).toContain('"data-dh-island-value": "mouseenter"');
      expect(result.code).toContain('"data-dh-client-target"');
      expect(result.code).toContain('"data-dh-client-strategy"');
      expect(result.code).toContain('"visible"');
    });

    it("should resolve package-local @/ imports using the nearest tsconfig paths", async () => {
      const plugin = dathomirVitePlugin();
      const importer = path.join(repoRoot, "packages/components/src/index.ts");
      const expected = path.join(
        repoRoot,
        "packages/components/src/css/implementation.ts",
      );

      const resolved = await invokeResolveId(
        plugin,
        "@/css/implementation",
        importer,
      );

      expect(resolved).toBe(expected);
    });

    it("should resolve directory aliases to index.ts using tsconfig paths", async () => {
      const plugin = dathomirVitePlugin();
      const importer = path.join(repoRoot, "packages/runtime/src/index.ts");
      const expected = path.join(repoRoot, "packages/runtime/src/ssr/index.ts");

      const resolved = await invokeResolveId(plugin, "@/ssr", importer);

      expect(resolved).toBe(expected);
    });

    it("should ignore aliases when no matching tsconfig path mapping exists", async () => {
      const plugin = dathomirVitePlugin();
      const importer = path.join(repoRoot, "packages/runtime/src/index.ts");

      const resolved = await invokeResolveId(plugin, "#internal/foo", importer);

      expect(resolved).toBeNull();
    });
  });

  describe("edge mode detection", () => {
    it("should detect SSR mode from edge environment name", () => {
      const plugin = dathomirVitePlugin();
      const context = {
        environment: { name: "edge" },
      };

      invokeViteTransform(
        plugin,
        "const x = <div />;",
        "component.tsx",
        {},
        context,
      );

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ mode: "ssr" }),
      );
    });

    it("should detect CSR mode from client environment name", () => {
      const plugin = dathomirVitePlugin();
      const context = {
        environment: { name: "client" },
      };

      invokeViteTransform(
        plugin,
        "const x = <div />;",
        "component.tsx",
        {},
        context,
      );

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ mode: "csr" }),
      );
    });
  });

  describe("unplugin rollup factory (non-Vite bundlers)", () => {
    it("should include JSX/TSX files via transformInclude", () => {
      const plugin = dathomirRollupPlugin({}) as unknown as RollupLikePlugin;

      expect(plugin.transformInclude("component.tsx")).toBe(true);
      expect(plugin.transformInclude("component.jsx")).toBe(true);
    });

    it("should exclude non-JSX/TSX files via transformInclude", () => {
      const plugin = dathomirRollupPlugin({}) as unknown as RollupLikePlugin;

      expect(plugin.transformInclude("module.ts")).toBe(false);
      expect(plugin.transformInclude("styles.css")).toBe(false);
    });

    it("should transform JSX/TSX files via transform hook", () => {
      const plugin = dathomirRollupPlugin({}) as unknown as RollupLikePlugin;
      const transformHook = plugin.transform;

      const result = transformHook.call(
        {},
        "const x = <div />;",
        "component.tsx",
      );

      expect(transform).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should detect SSR mode from ssr environment name in unplugin transform", () => {
      const plugin = dathomirRollupPlugin({}) as unknown as RollupLikePlugin;
      const transformHook = plugin.transform;

      transformHook.call(
        { environment: { name: "ssr" } },
        "const x = <div />;",
        "component.tsx",
      );

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ mode: "ssr" }),
      );
    });

    it("should detect SSR mode from edge environment name in unplugin transform", () => {
      const plugin = dathomirRollupPlugin({}) as unknown as RollupLikePlugin;
      const transformHook = plugin.transform;

      transformHook.call(
        { environment: { name: "edge" } },
        "const x = <div />;",
        "component.tsx",
      );

      expect(transform).toHaveBeenCalledWith(
        "const x = <div />;",
        expect.objectContaining({ mode: "ssr" }),
      );
    });
  });
});
