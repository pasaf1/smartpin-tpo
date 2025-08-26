import next from '@next/eslint-plugin-next'

export default [
	{ ignores: ['.next/**', 'node_modules/**', '**/*.{ts,tsx}'] },
	{
	files: ['**/*.{js,jsx}'],
		plugins: { '@next/next': next },
		rules: {
	// Minimal lint: Next plugin available; no TS/React Hooks plugins required
		},
	},
]

