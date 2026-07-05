import { defineConfig } from 'vitest/config';

// Standalone config: the domain layer is pure TypeScript, so tests run without
// the SvelteKit plugin (no SSR/browser environment needed).
export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.ts'],
		environment: 'node'
	}
});
