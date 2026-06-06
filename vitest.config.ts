import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib')
		}
	},
	test: {
		globals: false,
		environment: 'node',
		include: ['src/**/*.test.ts'],
		exclude: ['node_modules', '.svelte-kit'],
		pool: 'forks'
	}
});
