import { defineConfig } from "wxt";

// Configure extension manifest: set extension name
export default defineConfig({
	manifestVersion: 3,
	manifest: ({ browser }) => ({
		name: "xselect2copy",
		permissions: ["storage", "clipboardWrite"],
		options_page: "options.html",
		version: "1.0.2",

		browser_specific_settings: {
			gecko: {
				id: "xselect2copy@xselect2copy.com",
				data_collection_permissions: { required: ["none"] },
			},
		},
	}),
});
