import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Hono } from "hono";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = new Hono();

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.get("/", async (c) => {
    try {
      let template = fs.readFileSync(
        path.resolve(__dirname, "index.html"),
        "utf-8",
      );

      template = await vite.transformIndexHtml("/", template);
      const { render } = await vite.ssrLoadModule("/src/ssr-entry.tsx");
      const appHtml = render();

      const html = template.replace("<!--ssr-outlet-->", appHtml);

      return c.html(html);
    } catch (e) {
      if (e instanceof Error) vite.ssrFixStacktrace(e);
      console.error(e);
      return c.text("Internal Server Error", 500);
    }
  });

  const port = 5174;

  const server = http.createServer(async (req, res) => {
    const url = req.url || "/";
    if (url === "/" || url.startsWith("/?")) {
      const response = await app.fetch(
        new Request(`http://localhost:${port}${url}`, {
          method: req.method,
          headers: req.headers as HeadersInit,
        }),
      );
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      const body = await response.text();
      res.end(body);
      return;
    }

    vite.middlewares(req, res, () => {
      res.statusCode = 404;
      res.end("Not Found");
    });
  });

  server.listen(port, () => {
    console.log(`SSR server running at http://localhost:${port}/`);
    console.log(`Vite dev server at http://localhost:${port}/`);
  });
}

createServer();
