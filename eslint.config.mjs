// ESLint Flat config for Next.js + TypeScript (ESLint v9)
// - Lints TS/TSX and JS/JSX
// - Keeps rules practical for CI and local dev

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
	// Ignores
	{
		ignores: [
			'.next/**',
			'node_modules/**',
			'dist/**',
			'coverage/**',
			'build/**',
			'public/**',
		],
	},

	// Base JS config
	{
		...js.configs.recommended,
		files: ['**/*.{js,mjs,cjs,jsx}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'prefer-const': 'warn',
		},
	},

	// TypeScript configs (non type-aware for speed)
	...tseslint.configs.recommended.map((config) => ({
		...config,
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			...config.languageOptions,
			parserOptions: {
				...config.languageOptions?.parserOptions,
				ecmaVersion: 'latest',
				sourceType: 'module',
				project: false,
				tsconfigRootDir: process.cwd(),
			},
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			...config.rules,
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
		},
	})),

	// React Hooks rules (works for both TSX/JSX)
	{
		files: ['**/*.{tsx,jsx}'],
		plugins: { 'react-hooks': reactHooks },
		rules: {
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},

	// Service worker specific
	{
		files: ['public/sw.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'script',
			globals: {
				self: 'readonly',
				caches: 'readonly',
				fetch: 'readonly',
				clients: 'readonly',
				URL: 'readonly',
				Response: 'readonly',
				Request: 'readonly',
				File: 'readonly',
				FormData: 'readonly',
				indexedDB: 'readonly',
				console: 'readonly',
			},
		},
		rules: {
			'no-console': 'off',
			'no-undef': 'off',
		},
	},
]

