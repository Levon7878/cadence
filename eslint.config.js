import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';

/**
 * Enforces the layered architecture dependency direction:
 * app > pages > widgets > features > entities > shared
 * A layer may only import from layers at or below it.
 */
const layerZones = [
  { target: './src/shared', from: ['./src/entities', './src/features', './src/widgets', './src/pages', './src/app'] },
  { target: './src/entities', from: ['./src/features', './src/widgets', './src/pages', './src/app'] },
  { target: './src/features', from: ['./src/widgets', './src/pages', './src/app'] },
  { target: './src/widgets', from: ['./src/pages', './src/app'] },
  { target: './src/pages', from: ['./src/app'] },
];

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'public/mockServiceWorker.js', 'api/catchall.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
        node: true,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/no-restricted-paths': ['error', { zones: layerZones }],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*', 'src/mocks/**/*'],
    rules: {
      'import/no-restricted-paths': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
