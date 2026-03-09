import { defineConfig } from 'oxlint';

export const config = defineConfig({
  ignorePatterns: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'import', 'promise'],
  rules: {
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-console': 'error',
    'import/no-unresolved': 'error',
    'no-explicit-any': 'warn',
    'no-non-null-assertion': 'warn',
    'prefer-await-to-then': 'warn',
    'promise-function-async': 'warn',
  },
});