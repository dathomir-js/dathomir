import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["playgrounds/e2e/src/**/*.test.ts"],
    fileParallelism: false,
    hookTimeout: 180000,
    testTimeout: 180000,
  },
});
