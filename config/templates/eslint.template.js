import tsParser from '@typescript-eslint/parser';
import * as importPlugin from 'eslint-plugin-import';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
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
                pattern: '@/**',
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
        "import/no-relative-parent-imports": "error",
        "no-restricted-imports": ["error", { "patterns": ["../*"] }]
      },
    },
    {
      plugins: {
        'no-relative-import-paths': noRelativeImportPaths,
      },
      rules: {
        'no-relative-import-paths/no-relative-import-paths': [
          'error',
          {
            allowSameFolder: false,
            rootDir: 'src',
            prefix: '@/',
          }
        ]
      },
    },
    {
      files: ["test/**", "**/*.test.ts", "**/*.spec.ts"],
      rules: {
        "import/no-relative-parent-imports": "off",
        "no-restricted-imports": "off",
        "no-relative-import-paths/no-relative-import-paths": "off",
      },
    },
    // ...oxlint.buildFromOxlintConfigFile(`${cwd()}/.oxlintrc.json`),
    ...oxlint.configs['flat/recommended'],
  ]

  return configs;
}