import { defineConfig } from "vite";
import { dathomir } from "@dathomir/plugin"
import Inspect from "vite-plugin-inspect";


export default defineConfig({
  plugins: [dathomir.vite(), Inspect()],
  server: {
    port: 5173,
  },
});