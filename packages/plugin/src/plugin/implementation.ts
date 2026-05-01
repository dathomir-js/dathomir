import { transform } from "@dathra/transformer";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { createUnplugin, type UnpluginContext } from "unplugin";
import type {
  TransformResult,
  Plugin as VitePlugin,
  UserConfig,
  ViteDevServer,
} from "vite";

/**
 * Plugin options for the Dathra plugin.
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
   * Module to import runtime functions from (default: '@dathra/core').
   */
  runtimeModule?: string;

  /**
   * Force a specific mode (overrides automatic detection).
   */
  mode?: "csr" | "ssr";

  /**
   * Configure Vite dev SSR HTML rendering.
   */
  ssr?: false | PluginSsrOptions;
}

interface PluginSsrContext {
  requestId: string;
  routePath: string;
  url: string;
}

interface PluginSsrOptions {
  /** SSR module entry passed to Vite's ssrLoadModule(). */
  entry: string;

  /** HTML placeholder replaced with the rendered app HTML. */
  outlet?: string;

  /** Export name to call from the SSR module. Defaults to `render`, then default. */
  renderExport?: string;

  /** Resolve a request pathname into an SSR route path. Return undefined to skip. */
  resolveRoute?: (pathname: string) => string | undefined;

  /** HTML used when SSR rendering fails. */
  fallback?: string | ((context: PluginSsrContext) => string);
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
): "csr" | "ssr" {
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

type PluginTransformOutput = {
  code: string;
  map?: TransformResult["map"];
};

type TsconfigPaths = Record<string, string[]>;

type SsrRenderModule = Record<string, unknown> & {
  default?: unknown;
  render?: unknown;
};

const tsconfigPathCache = new Map<string, TsconfigPaths | null>();
const require = createRequire(import.meta.url);

function parseLooseJson(text: string): unknown {
  return JSON.parse(text.replace(/,\s*([}\]])/g, "$1"));
}

function parseSourceMap(
  sourceMap: string | undefined,
): PluginTransformOutput["map"] | undefined {
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

  for (;;) {
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
    const parsed = parseLooseJson(raw);
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

function createRequestId(requestUrl: URL): string {
  return (
    requestUrl.searchParams.get("requestId") ??
    `dathra-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

function defaultResolveSsrRoute(pathname: string): string | undefined {
  if (pathname.startsWith("/@") || pathname.startsWith("/node_modules/")) {
    return undefined;
  }

  if (pathname === "/index.html") {
    return "/";
  }

  return path.extname(pathname) === "" ? pathname : undefined;
}

function acceptsHtml(headers: { accept?: string | string[] }): boolean {
  const acceptHeader = headers.accept;
  const accept = Array.isArray(acceptHeader)
    ? acceptHeader.join(",")
    : (acceptHeader ?? "");

  return (
    accept === "" || accept.includes("text/html") || accept.includes("*/*")
  );
}

function getSsrRenderFunction(
  ssrModule: SsrRenderModule,
  exportName: string,
): ((context: PluginSsrContext) => string | Promise<string>) | null {
  const candidate = ssrModule[exportName] ?? ssrModule.default;
  return typeof candidate === "function"
    ? (candidate as (context: PluginSsrContext) => string | Promise<string>)
    : null;
}

function resolveFallbackHtml(
  fallback: PluginSsrOptions["fallback"],
  context: PluginSsrContext,
): string {
  if (typeof fallback === "function") {
    return fallback(context);
  }

  return fallback ?? "";
}

function configureSsrDevServer(
  vite: ViteDevServer,
  ssrOptions: PluginSsrOptions,
): void {
  const outlet = ssrOptions.outlet ?? "<!--ssr-outlet-->";
  const renderExport = ssrOptions.renderExport ?? "render";
  const resolveRoute = ssrOptions.resolveRoute ?? defaultResolveSsrRoute;

  vite.middlewares.use(async (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    if (!acceptsHtml(req.headers)) {
      next();
      return;
    }

    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const routePath = resolveRoute(requestUrl.pathname);
    if (routePath === undefined) {
      next();
      return;
    }

    const context: PluginSsrContext = {
      requestId: createRequestId(requestUrl),
      routePath,
      url: `${requestUrl.pathname}${requestUrl.search}`,
    };

    try {
      let template = fs.readFileSync(
        path.resolve(vite.config.root, "index.html"),
        "utf-8",
      );
      template = await vite.transformIndexHtml(requestUrl.pathname, template);

      try {
        const ssrModule = (await vite.ssrLoadModule(
          ssrOptions.entry,
        )) as SsrRenderModule;
        const render = getSsrRenderFunction(ssrModule, renderExport);
        if (render === null) {
          throw new Error(
            `[dathra] SSR module does not export a ${renderExport}() or default render function`,
          );
        }

        const appHtml = await render(context);
        const html = template.replace(outlet, appHtml);

        res.writeHead(200, {
          "Content-Type": "text/html",
          "X-Dathra-Request-Id": context.requestId,
        });
        res.end(html);
      } catch (ssrError) {
        vite.ssrFixStacktrace(ssrError as Error);
        vite.config.logger.error(
          `[dathra] SSR Error: ${
            ssrError instanceof Error ? ssrError.message : String(ssrError)
          }`,
        );

        const html = template.replace(
          outlet,
          resolveFallbackHtml(ssrOptions.fallback, context),
        );

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
      }
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
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
): PluginTransformOutput | null {
  if (!shouldTransform(id, options)) {
    return null;
  }

  try {
    const mode = detectMode(options.mode, environmentName, isSsr);

    const result = transform(code, {
      mode,
      sourceMap: true,
      filename: id,
      runtimeModule: options.runtimeModule ?? "@dathra/core",
    });

    const map = parseSourceMap(result.map);

    return map === undefined
      ? {
          code: result.code,
        }
      : {
          code: result.code,
          map,
        };
  } catch (error) {
    if (error instanceof Error) {
      error.message = `[dathra] Error transforming ${id}: ${error.message}`;
    }
    throw error;
  }
}

/**
 * Create the Dathra Vite plugin with proper SSR detection.
 * Vite's transform hook receives ssr option directly.
 */
function createVitePlugin(options: PluginOptions = {}): VitePlugin {
  return {
    name: "dathra",
    enforce: "pre",

    config(config: UserConfig): UserConfig {
      return {
        esbuild: {
          ...(typeof config.esbuild === "object" ? config.esbuild : {}),
          jsx: "preserve",
        },
      };
    },

    configureServer(vite: ViteDevServer) {
      if (options.ssr === undefined || options.ssr === false) {
        return;
      }

      configureSsrDevServer(vite, options.ssr);
    },

    resolveId(source: string, importer?: string) {
      if (importer === undefined) {
        return null;
      }

      return resolveLocalSourceAlias(importer, source);
    },

    transform(
      this: ViteTransformContext,
      code: string,
      id: string,
      transformOptions?: { ssr?: boolean },
    ) {
      const isSsr = transformOptions?.ssr ?? false;
      const environmentName = this.environment?.name;
      return doTransform(code, id, isSsr, environmentName, options);
    },
  };
}

/**
 * Create the Dathra unplugin factory for non-Vite bundlers.
 */
const unpluginFactory = createUnplugin((options: PluginOptions = {}) => {
  return {
    name: "dathra",

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
 * Universal dathra plugin (unplugin factory).
 */
const dathra = unpluginFactory;

/**
 * Vite plugin for Dathra with proper SSR detection.
 */
const dathraVitePlugin = createVitePlugin;

/**
 * Webpack plugin for Dathra.
 */
const dathraWebpackPlugin = dathra.webpack;

/**
 * Rollup plugin for Dathra.
 */
const dathraRollupPlugin = dathra.rollup;

/**
 * esbuild plugin for Dathra.
 */
const dathraEsbuildPlugin = dathra.esbuild;

export {
  dathra,
  dathraEsbuildPlugin,
  dathraRollupPlugin,
  dathraVitePlugin,
  dathraWebpackPlugin,
};
export type { PluginOptions };
export default dathra;
