import { dathomirVitePlugin } from "@dathomir/plugin";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vite";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function workspacePath(relativePath: string): string {
  return path.resolve(projectRoot, relativePath);
}

const workspaceAliases = [
  {
    find: "@dathomir/core/jsx-runtime",
    replacement: workspacePath("../../packages/core/src/jsx-runtime/index.ts"),
  },
  {
    find: "@dathomir/core/jsx-dev-runtime",
    replacement: workspacePath("../../packages/core/src/jsx-runtime/index.ts"),
  },
  {
    find: "@dathomir/components/ssr",
    replacement: workspacePath("../../packages/components/src/ssr/index.ts"),
  },
  {
    find: "@dathomir/components/internal",
    replacement: workspacePath("../../packages/components/src/internal.ts"),
  },
  {
    find: "@dathomir/runtime/ssr",
    replacement: workspacePath("../../packages/runtime/src/ssr/index.ts"),
  },
  {
    find: "@dathomir/runtime/hydration",
    replacement: workspacePath("../../packages/runtime/src/hydration/index.ts"),
  },
  {
    find: "@dathomir/store/internal",
    replacement: workspacePath("../../packages/store/src/internal.ts"),
  },
  {
    find: /^@dathomir\/core$/,
    replacement: workspacePath("../../packages/core/src/index.ts"),
  },
  {
    find: /^@dathomir\/components$/,
    replacement: workspacePath("../../packages/components/src/index.ts"),
  },
  {
    find: /^@dathomir\/runtime$/,
    replacement: workspacePath("../../packages/runtime/src/index.ts"),
  },
  {
    find: /^@dathomir\/store$/,
    replacement: workspacePath("../../packages/store/src/index.ts"),
  },
  {
    find: /^@dathomir\/reactivity$/,
    replacement: workspacePath("../../packages/reactivity/src/index.ts"),
  },
  {
    find: /^@dathomir\/shared$/,
    replacement: workspacePath("../../packages/shared/src/index.ts"),
  },
];

const workspacePackages = [
  "@dathomir/core",
  "@dathomir/components",
  "@dathomir/runtime",
  "@dathomir/store",
  "@dathomir/reactivity",
  "@dathomir/shared",
];

export default defineConfig({
  root: projectRoot,
  plugins: [dathomirVitePlugin()],
  resolve: {
    alias: workspaceAliases,
  },
  optimizeDeps: {
    exclude: workspacePackages,
  },
  ssr: {
    noExternal: workspacePackages,
  },
  esbuild: {
    // Disable esbuild JSX transform - let our plugin handle it
    jsx: "preserve",
  },
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
});
