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
    const url = req.url || "/";

    try {
      // Handle static assets via Vite
      if (url !== "/" && !url.startsWith("/@") && !url.startsWith("/src")) {
        vite.middlewares(req, res, () => {
          res.statusCode = 404;
          res.end("Not found");
        });
        return;
      }

      // For root path, serve the index.html with SSR content
      if (url === "/" || url === "/index.html") {
        let template = fs.readFileSync(
          path.resolve(__dirname, "index.html"),
          "utf-8"
        );

        // Apply Vite HTML transforms
        template = await vite.transformIndexHtml(url, template);

        // Load and execute SSR module
        try {
          const ssrModule = await vite.ssrLoadModule("/src/entry-server.tsx");
          const appHtml = ssrModule.render();

          // Replace the SSR outlet with rendered content
          const html = template.replace("<!--ssr-outlet-->", appHtml);

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(html);
        } catch (ssrError) {
          console.error("SSR Error:", ssrError);
          // Fallback to CSR
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(template);
        }
        return;
      }

      // Let Vite handle everything else
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

  server.listen(port, () => {
    console.log(`\n  🚀 SSR Server running at http://localhost:${port}\n`);
  });
}

createServer();
