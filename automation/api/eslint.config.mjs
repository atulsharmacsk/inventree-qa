import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['allure-results/', 'allure-report/', 'allure-history/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    // Everything here runs under Node (specs, config, src).
    languageOptions: { globals: globals.node },
    rules: {
      // Matches the project's own rule: strict TypeScript, no `any`, no non-null assertions on API data.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
