import js from '@eslint/js'
import prettier from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import babelParser from '@babel/eslint-parser'

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
      },
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      'space-before-function-paren': 'off',
      'new-cap': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
      camelcase: 'off',
    },
  },
]