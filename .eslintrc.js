'use strict';

module.exports = {
  env: {
    es6: true,
    node: true,
    commonjs: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:node/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    strict: 'error',
    'no-new': 'error',
    'no-process-exit': 'off',
    'node/no-unpublished-require': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
  },
};
