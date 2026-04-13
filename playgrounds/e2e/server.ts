import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createServer as createViteServer } from "vite";

import { routes } from "./src/routes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isPreview = process.argv.includes("--preview");
const port = Number(process.env.PORT ?? "3190");

type RenderModule = {
  render(context?: { routePath?: string }): Promise<string>;
  renderParallelProbe?(): Promise<unknown>;
};

function normalizeRoute(pathname: string): string {
  if (pathname === "/index.html") {
    return "/";
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function resolveRoutePath(pathname: string): string | undefined {
  const normalized = normalizeRoute(pathname);
  return routes.includes(normalized as (typeof routes)[number])
    ? normalized
    : undefined;
}

function renderClientFallback(routePath: string): string {
  return `<e2e-ssr-app routePath="${routePath}"></e2e-ssr-app>`;
}

function getContentType(filePath: string): string {
  switch (path.extname(filePath)) {
    case ".js":
    case ".mjs":
      return "text/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

function resolveStaticFile(baseDir: string, pathname: string): string | null {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const resolvedPath = path.resolve(baseDir, `.${requestedPath}`);

  if (!resolvedPath.startsWith(baseDir)) {
    return null;
  }

  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
    return null;
  }

  return resolvedPath;
}

function serveStaticFile(
  res: import("node:http").ServerResponse,
  filePath: string,
): void {
  res.writeHead(200, {
    "Content-Type": getContentType(filePath),
  });
  res.end(fs.readFileSync(filePath));
}

async function loadPreviewRenderModule(): Promise<RenderModule> {
  const entryPath = path.resolve(__dirname, "dist/server/entry-server.js");
  const entryUrl = pathToFileURL(entryPath);
  entryUrl.searchParams.set("t", String(fs.statSync(entryPath).mtimeMs));
  return (await import(entryUrl.href)) as RenderModule;
}

async function createPreviewServer() {
  const clientDir = path.resolve(__dirname, "dist/client");
  const templatePath = path.resolve(clientDir, "index.html");

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      "[playground/e2e] Missing dist/client/index.html. Run `pnpm --filter @playground/e2e build` first.",
    );
  }

  const { createServer: createHttpServer } = await import("node:http");

  return createHttpServer(async (req, res) => {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    const pathname = requestUrl.pathname;
    const routePath = resolveRoutePath(pathname);

    try {
      if (pathname === "/api/als/parallel") {
        const ssrModule = await loadPreviewRenderModule();
        const payload = await ssrModule.renderParallelProbe?.();

        if (payload === undefined) {
          throw new Error(
            "[playground/e2e] Preview SSR module does not expose renderParallelProbe()",
          );
        }

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(payload));
        return;
      }

      const staticFile = resolveStaticFile(clientDir, pathname);
      if (staticFile !== null && routePath === undefined) {
        serveStaticFile(res, staticFile);
        return;
      }

      if (routePath !== undefined) {
        const template = fs.readFileSync(templatePath, "utf-8");

        try {
          const ssrModule = await loadPreviewRenderModule();
          const appHtml = await ssrModule.render({ routePath });
          const html = template.replace("<!--ssr-outlet-->", appHtml);

          res.writeHead(200, {
            "Content-Type": "text/html",
          });
          res.end(html);
        } catch (ssrError) {
          console.error("SSR Error:", ssrError);
          const html = template.replace(
            "<!--ssr-outlet-->",
            renderClientFallback(routePath),
          );

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(html);
        }
        return;
      }

      if (staticFile !== null) {
        serveStaticFile(res, staticFile);
        return;
      }

      res.statusCode = 404;
      res.end("Not found");
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.end((error as Error).message);
    }
  });
}

async function createServer() {
  if (isPreview) {
    const previewServer = await createPreviewServer();
    previewServer.listen(port, "0.0.0.0", () => {
      console.log(
        `\n  E2E SSR Preview server running at http://localhost:${port}\n`,
      );
    });
    return;
  }

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  const { createServer: createHttpServer } = await import("node:http");

  const server = createHttpServer(async (req, res) => {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    const pathname = requestUrl.pathname;
    const routePath = resolveRoutePath(pathname);

    try {
      if (pathname === "/api/als/parallel") {
        const diagnosticsModule = await vite.ssrLoadModule(
          "/src/alsDiagnostics.ts",
        );
        const payload = await diagnosticsModule.runParallelIsolationProbe();

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(payload));
        return;
      }

      if (routePath !== undefined) {
        let template = fs.readFileSync(
          path.resolve(__dirname, "index.html"),
          "utf-8",
        );
        template = await vite.transformIndexHtml(pathname, template);

        try {
          const ssrModule = await vite.ssrLoadModule("/src/entry-server.tsx");
          const appHtml = await ssrModule.render({ routePath });
          const html = template.replace("<!--ssr-outlet-->", appHtml);

          res.writeHead(200, {
            "Content-Type": "text/html",
          });
          res.end(html);
        } catch (ssrError) {
          console.error("SSR Error:", ssrError);
          const html = template.replace(
            "<!--ssr-outlet-->",
            renderClientFallback(routePath),
          );

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(html);
        }
        return;
      }

      vite.middlewares(req, res, () => {
        res.statusCode = 404;
        res.end("Not found");
      });
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      console.error(error);
      res.statusCode = 500;
      res.end((error as Error).message);
    }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`\n  E2E SSR Server running at http://localhost:${port}\n`);
  });
}

createServer();
