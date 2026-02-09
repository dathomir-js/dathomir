import { dathomirVitePlugin } from "@dathomir/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [dathomirVitePlugin()],
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
