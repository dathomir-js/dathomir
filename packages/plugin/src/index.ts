import { transform, type TransformOptions } from "@dathomir/transformer";
import { createUnplugin } from "unplugin";

/**
 * Plugin options for the Dathomir plugin.
 */
interface PluginOptions {
  /**
   * File extensions to include (default: ['.tsx', '.jsx']).
   */
  include?: string[];

  /**
   * Patterns to exclude from transformation.
   */
  exclude?: string[];

  /**
   * Module to import runtime functions from (default: '@dathomir/core').
   */
  runtimeModule?: string;
}

/**
 * Check if a file should be transformed based on options.
 */
function shouldTransform(id: string, options: PluginOptions): boolean {
  const include = options.include ?? [".tsx", ".jsx"];
  const exclude = options.exclude ?? [];

  // Check exclusions first
  for (const pattern of exclude) {
    if (id.includes(pattern)) {
      return false;
    }
  }

  // Check inclusions
  for (const ext of include) {
    if (id.endsWith(ext)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect SSR mode from environment.
 * Priority: environment.name → options.ssr → import.meta.env.SSR
 */
function detectMode(
  environmentName?: string,
  optionsSsr?: boolean,
): TransformOptions["mode"] {
  // Vite Environment API (Vite 6+)
  if (environmentName === "ssr" || environmentName === "edge") {
    return "ssr";
  }
  if (environmentName === "client") {
    return "csr";
  }

  // Legacy options.ssr
  if (optionsSsr === true) {
    return "ssr";
  }

  // Default to CSR
  return "csr";
}

/**
 * Create the Dathomir unplugin factory.
 */
const unpluginFactory = createUnplugin((options: PluginOptions = {}) => {
  return {
    name: "dathomir",

    transformInclude(id: string) {
      return shouldTransform(id, options);
    },

    transform(code: string, id: string) {
      try {
        // Detect mode (CSR for Phase 1, SSR support in Phase 2)
        const mode = detectMode();

        const result = transform(code, {
          mode,
          sourceMap: true,
          filename: id,
          runtimeModule: options.runtimeModule ?? "@dathomir/core",
        });

        return {
          code: result.code,
          map: result.map ? JSON.parse(result.map) : undefined,
        };
      } catch (error) {
        // Re-throw with file context
        if (error instanceof Error) {
          error.message = `[dathomir] Error transforming ${id}: ${error.message}`;
        }
        throw error;
      }
    },
  };
});

/**
 * Universal dathomir plugin (unplugin factory).
 */
const dathomir = unpluginFactory;

/**
 * Vite plugin for Dathomir.
 */
const dathomirVitePlugin = dathomir.vite;

/**
 * Webpack plugin for Dathomir.
 */
const dathomirWebpackPlugin = dathomir.webpack;

/**
 * Rollup plugin for Dathomir.
 */
const dathomirRollupPlugin = dathomir.rollup;

/**
 * esbuild plugin for Dathomir.
 */
const dathomirEsbuildPlugin = dathomir.esbuild;

export {
  dathomir,
  dathomirEsbuildPlugin,
  dathomirRollupPlugin,
  dathomirVitePlugin,
  dathomirWebpackPlugin,
};
export type { PluginOptions };
export default dathomir;
