import { defineConfig } from 'oxlint';

import { config } from './templates/oxlint.template.ts';

export default defineConfig({
  extends: [config],
});