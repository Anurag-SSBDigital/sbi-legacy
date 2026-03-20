import globals from 'globals'
import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import oxlint from 'eslint-plugin-oxlint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default [
  ...tseslint.config(
    { ignores: ['dist', 'src/components/ui'] },
    {
      extends: [
        js.configs.recommended,
        ...tseslint.configs.recommended,
        ...pluginQuery.configs['flat/recommended'],
      ],
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
      },
      plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': [
          'warn',
          { allowConstantExport: true },
        ],
        'no-restricted-globals': [
          'error',
          {
            name: 'fetch',
            message:
              'Use $api.useQuery/$api.useMutation in components or custom hooks. For low-level HTTP, use fetchClient in src/lib/api.ts.',
          },
        ],
        'no-restricted-properties': [
          'error',
          {
            object: 'window',
            property: 'fetch',
            message:
              'Use $api.useQuery/$api.useMutation in components or custom hooks. For low-level HTTP, use fetchClient in src/lib/api.ts.',
          },
          {
            object: 'globalThis',
            property: 'fetch',
            message:
              'Use $api.useQuery/$api.useMutation in components or custom hooks. For low-level HTTP, use fetchClient in src/lib/api.ts.',
          },
          {
            object: 'self',
            property: 'fetch',
            message:
              'Use $api.useQuery/$api.useMutation in components or custom hooks. For low-level HTTP, use fetchClient in src/lib/api.ts.',
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'axios',
                allowTypeImports: true,
                message:
                  'Do not use axios directly. Use $api.useQuery/$api.useMutation or fetchClient.',
              },
            ],
          },
        ],
        'no-console': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            args: 'all',
            argsIgnorePattern: '^_',
            caughtErrors: 'all',
            caughtErrorsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
      },
    }
  ),
  {
    files: ['src/lib/api.ts'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-properties': 'off',
    },
  },
  ...oxlint.configs['flat/recommended'],
]
