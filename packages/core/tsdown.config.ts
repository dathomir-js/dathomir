import { defineConfig } from "@dathomir/config/tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/reactivity/index.ts", "src/shared/index.ts"],
  dts: true,
  outDir: "dist",
  clean: true,
  format: ["cjs", "esm"],
  sourcemap: true,
  minify: false,
});
