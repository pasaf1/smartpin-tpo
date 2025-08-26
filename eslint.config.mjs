// eslint.config.mjs
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

// Plugins loaded explicitly so rule names are always resolvable
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from '@typescript-eslint/eslint-plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  // keep defaults; compat pulls in next/core-web-vitals & next/typescript
})

export default [
  // Next.js base + TS rules via compat
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // Your project rules/ignores
  {
    // apply to all source files
    files: ['**/*.{js,jsx,ts,tsx}'],

    // make sure plugins are available for the rules below
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      '@typescript-eslint': tseslint,
    },

    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      '.vercel/**',
      'next-env.d.ts',
    ],

    rules: {
      // Don’t block builds on these:
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
  // Disable problematic rule that crashes with certain plugin versions
  '@typescript-eslint/no-unused-expressions': 'off',
      '@next/next/no-img-element': 'warn',
      'react-hooks/exhaustive-deps': 'warn',

      // Keep correctness errors:
      'react-hooks/rules-of-hooks': 'error',

      // Prefer not to block deploys on text issues; downgrade to warn
      'react/no-unescaped-entities': 'warn',
    },

    settings: {
      react: { version: 'detect' },
    },

    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
]
