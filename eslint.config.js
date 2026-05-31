const js = require('@eslint/js');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

const nodeGlobals = {
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  exports: 'writable',
  module: 'readonly',
  process: 'readonly',
  require: 'readonly',
  setTimeout: 'readonly',
};

const jestGlobals = {
  describe: 'readonly',
  expect: 'readonly',
  test: 'readonly',
};

module.exports = [
  {
    ignores: ['tests/rn-versions/**'],
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ['src/*.{js,jsx}', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...nodeGlobals,
        ...jestGlobals,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'no-unused-vars': 'warn',
      'prettier/prettier': 'error',
      'newline-before-return': 'warn',
      'no-useless-escape': 0,
    },
  },
];
