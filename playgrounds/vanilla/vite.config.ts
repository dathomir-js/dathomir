import { defineConfig } from "vite";
import { ailuros } from "@ailuros/plugin"
import Inspect from "vite-plugin-inspect";


export default defineConfig({
  plugins: [ailuros.vite(), Inspect()],
  server: {
    port: 5173,
  },
});