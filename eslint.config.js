// @ts-check
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Constitution Principle V: every source file is scoped to one concern and MUST NOT exceed 600
// lines. This is enforced here (max-lines, error) rather than left to review judgment.
const MAX_LINES = 600;

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/.specify/**',
      '**/migrations/**',
      'packages/db/src/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'max-lines': ['error', { max: MAX_LINES, skipBlankLines: true, skipComments: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // packages/{ui,web} are the only React packages, and their hook files aren't always .tsx
    // (no JSX in them) — match .ts there too so react-hooks/exhaustive-deps is actually known.
    files: ['**/*.{jsx,tsx}', 'packages/{ui,web}/src/**/*.ts'],
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
    },
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'e2e/**/*.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      // Test files legitimately grow with fixtures/cases; keep the ceiling but relax slightly.
      'max-lines': ['error', { max: MAX_LINES, skipBlankLines: true, skipComments: true }],
    },
  },
  prettierConfig,
);
