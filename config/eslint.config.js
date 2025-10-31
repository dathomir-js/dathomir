import { cwd } from "node:process";

import { eslint } from "./templates/eslint.template.js";

export default eslint(`${cwd()}/.oxlintrc.json`);