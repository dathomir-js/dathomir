import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import { eslint } from "./templates/eslint.template.js";

export default [
  ...eslint(),
  {
    plugins: {
      'no-relative-import-paths': noRelativeImportPaths,
    },
    rules: {
      'no-relative-import-paths/no-relative-import-paths': "off"
    },
  },
];