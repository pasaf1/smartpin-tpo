import next from '@next/eslint-plugin-next'

export default [
	{ ignores: ['.next/**', 'node_modules/**'] },
	{
		files: ['**/*.{js,jsx}'],
		plugins: { '@next/next': next },
		rules: {
			// Next.js specific rules
			'@next/next/no-html-link-for-pages': 'error',
			'@next/next/no-img-element': 'warn',
			'@next/next/no-unwanted-polyfillio': 'error',
		},
	},
]

