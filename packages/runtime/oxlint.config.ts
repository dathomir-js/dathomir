import { defineConfig } from "@dathomir/config/oxlint";
import { config } from "@dathomir/config/templates/oxlint.template.ts";

export default defineConfig({
  extends: [config],
  overrides: [
    {
      files: ["src/**/*.ts"],
      rules: {
        "no-console": "off",
      },
    },
  ],
});
