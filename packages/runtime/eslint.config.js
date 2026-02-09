import { eslint } from "@dathomir/config/templates/eslint.template.js";

export default [
  ...eslint(),
  {
    files: ["src/hydration/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];