import { defineConfig } from "@dathomir/config/tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/ssr/index.ts"],
  dts: {
    oxc: false,
  },
  outDir: "dist",
  clean: true,
  format: ["cjs", "esm"],
  sourcemap: true,
  minify: true,
});
