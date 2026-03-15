/**
 * SSR Development Server.
 *
 * This server demonstrates:
 * - Server-side rendering with Vite
 * - SSR mode transformation
 * - HTML streaming (future)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isPreview = process.argv.includes("--preview");
let pageRequestCount = 0;

const routedPages = new Set([
  "/",
  "/index.html",
  "/als",
  "/store-boundaries",
  "/component-ssr",
]);

function resolveRoutePath(pathname: string): string | undefined {
  if (pathname === "/index.html") {
    return "/";
  }

  return routedPages.has(pathname) ? pathname : undefined;
}

async function createServer() {
  const port = 3090;

  if (isPreview) {
    // Production preview mode
    console.log("Preview mode not yet implemented");
    return;
  }

  // Development mode with Vite
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  // Create a simple HTTP server
  const { createServer: createHttpServer } = await import("node:http");

  const server = createHttpServer(async (req, res) => {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    const pathname = requestUrl.pathname;
    const routePath = resolveRoutePath(pathname);

    try {
      if (pathname === "/api/als/parallel") {
        const diagnosticsModule = await vite.ssrLoadModule("/src/alsDiagnostics.ts");
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
          "utf-8"
        );

        // Apply Vite HTML transforms
        template = await vite.transformIndexHtml(pathname, template);

        // Load and execute SSR module
        try {
          const requestId =
            requestUrl.searchParams.get("requestId") ??
            `page-${++pageRequestCount}`;
          const ssrModule = await vite.ssrLoadModule("/src/entry-server.tsx");
          const appHtml = await ssrModule.render({
            requestId,
            routePath,
          });

          // Replace the SSR outlet with rendered content
          const html = template.replace("<!--ssr-outlet-->", appHtml);

          res.writeHead(200, {
            "Content-Type": "text/html",
            "X-Playground-Request-Id": requestId,
          });
          res.end(html);
        } catch (ssrError) {
          console.error("SSR Error:", ssrError);
          // Fallback to CSR
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(template);
        }
        return;
      }

      vite.middlewares(req, res, () => {
        res.statusCode = 404;
        res.end("Not found");
      });
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      console.error(e);
      res.statusCode = 500;
      res.end((e as Error).message);
    }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`\n  SSR Server running at http://localhost:${port}\n`);
  });
}

createServer();
