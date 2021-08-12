module.exports = {
  'parser': '@typescript-eslint/parser',
  'plugins': ['@typescript-eslint', 'eslint-plugin-import', 'jest'],
  'parserOptions': {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  'extends': ['eslint:recommended', 'google', 'plugin:jest/recommended'],
  'env': {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  'rules': {
    'max-len': ['warn', 120],
    'object-curly-spacing': ['error', 'always'],
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'import/no-nodejs-modules': 'warn',
    'import/extensions': ['error', 'always'],
    'import/newline-after-import': ['error', { 'count': 2 }],
    'import/order': ['error', {
      'groups': ['builtin', 'internal', 'external', ['sibling', 'parent']],
      'newlines-between': 'always',
      'alphabetize': {
        'order': 'ignore', // use ours that dont have defined
        'caseInsensitive': true,
      },
    }],
    'valid-jsdoc': 'off',
  },
  'globals': {
    chrome: 'readonly',
    globalThis: 'readonly',
    __dev: 'readonly',
  },
};
