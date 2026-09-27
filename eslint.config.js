const globals = require('globals');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: ['node_modules/**', 'coverage/**'],
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2024
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-undef': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'eqeqeq': ['error', 'always']
    }
  }
]);
