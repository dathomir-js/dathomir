import { dathraVitePlugin } from "@dathra/plugin";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig, type ViteDevServer } from "vite";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const workspacePackages = [
  "@dathra/core",
  "@dathra/components",
  "@dathra/runtime",
  "@dathra/store",
  "@dathra/reactivity",
  "@dathra/shared",
];

function playgroundAlsApi() {
  return {
    name: "playground-als-api",
    configureServer(vite: ViteDevServer) {
      vite.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

        try {
          if (pathname !== "/api/als/parallel") {
            next();
            return;
          }

          const diagnosticsModule = await vite.ssrLoadModule(
            "/src/alsDiagnostics.ts",
          );
          const payload = await diagnosticsModule.runParallelIsolationProbe();

          res.writeHead(200, {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          });
          res.end(JSON.stringify(payload));
        } catch (error) {
          vite.ssrFixStacktrace(error as Error);
          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  root: projectRoot,
  plugins: [
    playgroundAlsApi(),
    dathraVitePlugin({
      ssr: {
        entry: "/src/entry-server.tsx",
      },
    }),
  ],
  optimizeDeps: {
    exclude: workspacePackages,
  },
  ssr: {
    noExternal: workspacePackages,
  },
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
});
