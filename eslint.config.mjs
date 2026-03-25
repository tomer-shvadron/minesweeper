import js from '@eslint/js'
import importX from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactPlugin from 'eslint-plugin-react'
import reactCompiler from 'eslint-plugin-react-compiler'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'dev-dist/**'] },

  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  jsxA11y.flatConfigs.recommended,

  {
    plugins: {
      'react-hooks': reactHooks,
      'react-compiler': reactCompiler,
      'import-x': importX,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React Hooks
      ...reactHooks.configs.recommended.rules,

      // React Compiler — error if a component cannot be optimized
      'react-compiler/react-compiler': 'error',

      // Type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Require curly braces for all control flow — no one-liners
      curly: ['error', 'all'],

      // Unused vars — allow underscore-prefixed
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Import ordering
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',
    },
  }
)
