import path from "node:path";
import { defineConfig } from "vitest/config";

const withStoreSrc = path.resolve(import.meta.dirname, "src/withStore");

export default defineConfig({
  plugins: [
    {
      name: "store-als-swap",
      enforce: "pre",
      resolveId(source, importer) {
        if (importer === undefined || source !== "./internal") return;
        if (path.dirname(importer) === withStoreSrc) {
          return path.join(withStoreSrc, "internal.node.ts");
        }
      },
    },
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
    passWithNoTests: true,
  },
});
