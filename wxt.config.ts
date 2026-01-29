import { defineConfig } from 'wxt';

// Configure extension manifest: set extension name
export default defineConfig({
	manifest: {
		name: 'xselect2copy',
		permissions: ['storage'],
	},
});
