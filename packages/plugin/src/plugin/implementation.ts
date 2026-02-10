import { transform, type TransformOptions } from "@dathomir/transformer";
import { createUnplugin, type UnpluginContext } from "unplugin";
import type { TransformResult, Plugin as VitePlugin } from "vite";

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

  /**
   * Force a specific mode (overrides automatic detection).
   */
  mode?: "csr" | "ssr";
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
 * Per SPEC.typ (ADR: SSR モード伝播):
 * Priority: options.mode → environment.name → options.ssr → default CSR
 *
 * Environment names:
 * - 'client': CSR mode
 * - 'ssr': SSR mode
 * - 'edge': SSR mode (Edge runtime)
 */
function detectMode(
  forcedMode?: "csr" | "ssr",
  environmentName?: string,
  optionsSsr?: boolean,
): TransformOptions["mode"] {
  // User-specified mode takes highest priority
  if (forcedMode) {
    return forcedMode;
  }

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
 * Vite transform context with Environment API.
 */
interface ViteTransformContext extends UnpluginContext {
  environment?: {
    name: string;
  };
}

/**
 * Core transform function shared by all plugins.
 */
function doTransform(
  code: string,
  id: string,
  isSsr: boolean,
  environmentName: string | undefined,
  options: PluginOptions,
): TransformResult | null {
  if (!shouldTransform(id, options)) {
    return null;
  }

  try {
    const mode = detectMode(options.mode, environmentName, isSsr);

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
    if (error instanceof Error) {
      error.message = `[dathomir] Error transforming ${id}: ${error.message}`;
    }
    throw error;
  }
}

/**
 * Create the Dathomir Vite plugin with proper SSR detection.
 * Vite's transform hook receives ssr option directly.
 */
function createVitePlugin(options: PluginOptions = {}): VitePlugin {
  return {
    name: "dathomir",
    enforce: "pre",

    transform(code: string, id: string, transformOptions?: { ssr?: boolean }) {
      const isSsr = transformOptions?.ssr ?? false;
      const environmentName = this?.environment?.name;
      return doTransform(code, id, isSsr, environmentName, options);
    },
  };
}

/**
 * Create the Dathomir unplugin factory for non-Vite bundlers.
 */
const unpluginFactory = createUnplugin((options: PluginOptions = {}) => {
  return {
    name: "dathomir",

    transformInclude(id: string) {
      return shouldTransform(id, options);
    },

    transform(this: ViteTransformContext, code: string, id: string) {
      const environmentName = this.environment?.name;
      const isSsr = environmentName === "ssr" || environmentName === "edge";
      return doTransform(code, id, isSsr, environmentName, options)!;
    },
  };
});

/**
 * Universal dathomir plugin (unplugin factory).
 */
const dathomir = unpluginFactory;

/**
 * Vite plugin for Dathomir with proper SSR detection.
 */
const dathomirVitePlugin = createVitePlugin;

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
