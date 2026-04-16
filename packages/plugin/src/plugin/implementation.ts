import { transform, type TransformOptions } from "@dathomir/transformer";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
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
  if (forcedMode !== undefined) {
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

type TsconfigPaths = Record<string, string[]>;

const tsconfigPathCache = new Map<string, TsconfigPaths | null>();
const require = createRequire(import.meta.url);

function parseSourceMap(
  sourceMap: string | undefined,
): TransformResult["map"] | undefined {
  if (sourceMap === undefined) {
    return undefined;
  }

  const parsedSourceMap: unknown = JSON.parse(sourceMap);
  return isObjectRecord(parsedSourceMap)
    ? (parsedSourceMap as TransformResult["map"])
    : undefined;
}

function stripQueryAndHash(value: string): string {
  return value.split("?")[0]?.split("#")[0] ?? value;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizePathMappingValue(
  value: string,
  configDirectory: string,
): string {
  return value.replaceAll("${configDir}", configDirectory);
}

function resolveExtendsPath(
  configDirectory: string,
  extendsValue: string,
): string | null {
  if (extendsValue.startsWith(".") || extendsValue.startsWith("/")) {
    const directPath = path.resolve(configDirectory, extendsValue);
    if (fs.existsSync(directPath)) {
      return directPath;
    }

    const jsonPath = `${directPath}.json`;
    return fs.existsSync(jsonPath) ? jsonPath : null;
  }

  try {
    return require.resolve(extendsValue, { paths: [configDirectory] });
  } catch {
    return null;
  }
}

function findNearestTsconfigPath(importer: string): string | null {
  let currentDirectory = path.dirname(
    path.normalize(stripQueryAndHash(importer)),
  );

  while (true) {
    const tsconfigPath = path.join(currentDirectory, "tsconfig.json");
    if (fs.existsSync(tsconfigPath)) {
      return tsconfigPath;
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      return null;
    }
    currentDirectory = parentDirectory;
  }
}

function readTsconfigPaths(
  tsconfigPath: string,
  sourceDirectory = path.dirname(tsconfigPath),
): TsconfigPaths | null {
  const cacheKey = `${tsconfigPath}::${sourceDirectory}`;
  const cachedPaths = tsconfigPathCache.get(cacheKey);
  if (cachedPaths !== undefined) {
    return cachedPaths;
  }

  try {
    const raw = fs.readFileSync(tsconfigPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!isObjectRecord(parsed)) {
      tsconfigPathCache.set(cacheKey, null);
      return null;
    }

    const configDirectory = path.dirname(tsconfigPath);
    const inheritedPaths: TsconfigPaths = {};
    const extendsValue = parsed.extends;

    if (typeof extendsValue === "string") {
      const extendedTsconfigPath = resolveExtendsPath(
        configDirectory,
        extendsValue,
      );
      if (extendedTsconfigPath !== null) {
        Object.assign(
          inheritedPaths,
          readTsconfigPaths(extendedTsconfigPath, sourceDirectory) ?? {},
        );
      }
    }

    const compilerOptions = parsed.compilerOptions;
    if (!isObjectRecord(compilerOptions)) {
      tsconfigPathCache.set(cacheKey, inheritedPaths);
      return inheritedPaths;
    }

    const paths = compilerOptions.paths;
    if (!isObjectRecord(paths)) {
      tsconfigPathCache.set(cacheKey, inheritedPaths);
      return inheritedPaths;
    }

    const normalizedPaths: TsconfigPaths = { ...inheritedPaths };
    for (const [key, value] of Object.entries(paths)) {
      if (
        Array.isArray(value) &&
        value.every((item) => typeof item === "string")
      ) {
        normalizedPaths[key] = value.map((item) =>
          normalizePathMappingValue(item, sourceDirectory),
        );
      }
    }

    tsconfigPathCache.set(cacheKey, normalizedPaths);
    return normalizedPaths;
  } catch {
    tsconfigPathCache.set(cacheKey, null);
    return null;
  }
}

function matchPathAlias(pattern: string, source: string): string | null {
  if (!pattern.includes("*")) {
    return source === pattern ? "" : null;
  }

  const [prefix, suffix = ""] = pattern.split("*");
  if (!source.startsWith(prefix) || !source.endsWith(suffix)) {
    return null;
  }

  return source.slice(prefix.length, source.length - suffix.length);
}

function resolveCandidateFilePath(basePath: string): string | null {
  const candidatePaths = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.jsx"),
    basePath,
  ];

  return (
    candidatePaths.find((candidatePath) => fs.existsSync(candidatePath)) ?? null
  );
}

function resolveLocalSourceAlias(
  importer: string,
  source: string,
): string | null {
  const tsconfigPath = findNearestTsconfigPath(importer);
  if (tsconfigPath === null) {
    return null;
  }

  const paths = readTsconfigPaths(tsconfigPath);
  if (paths === null) {
    return null;
  }

  const tsconfigDirectory = path.dirname(tsconfigPath);
  for (const [pattern, replacements] of Object.entries(paths)) {
    const wildcardValue = matchPathAlias(pattern, source);
    if (wildcardValue === null) {
      continue;
    }

    for (const replacement of replacements) {
      const replacementPath = replacement.replaceAll("*", wildcardValue);
      const basePath = path.resolve(tsconfigDirectory, replacementPath);
      const resolvedPath = resolveCandidateFilePath(basePath);
      if (resolvedPath !== null) {
        return resolvedPath;
      }
    }
  }

  return null;
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
      map: parseSourceMap(result.map),
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

    resolveId(source: string, importer?: string) {
      if (importer === undefined) {
        return null;
      }

      return resolveLocalSourceAlias(importer, source);
    },

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
      return doTransform(code, id, isSsr, environmentName, options);
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
