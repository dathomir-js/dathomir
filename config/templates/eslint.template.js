import tsParser from '@typescript-eslint/parser';
import * as importPlugin from 'eslint-plugin-import';
import oxlint from 'eslint-plugin-oxlint';
import globals from 'globals';

export const eslint = () => {
  /**
   * @type {import("eslint").Linter.Config[]}
   */
  const configs = [
    {
      ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**"],
    },
    {
      files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    },
    {
      languageOptions: {
        globals: globals.browser,
        parser: tsParser,
      },
    },
    {
      plugins: { import: importPlugin },
      rules: {
        'import/order': [
          'error',
          {
            groups: ['builtin', 'external', 'parent', 'sibling', 'index', 'object', 'type'],
            pathGroups: [
              {
                pattern: '@src/**',
                group: 'parent',
                position: 'before',
              },
            ],
            pathGroupsExcludedImportTypes: ['builtin'],
            alphabetize: {
              order: 'asc',
            },
            'newlines-between': 'always',
          },
        ],
      },
    },
    // ...oxlint.buildFromOxlintConfigFile(`${cwd()}/.oxlintrc.json`),
    ...oxlint.configs['flat/recommended'],
  ]

  return configs;
}