import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const copyButtonTransformer = {
	name: "copy-button",
	pre(node) {
		node.properties["data-code"] = this.source;
	},
};

export default defineConfig({
	integrations: [mdx()],
	site: "https://fatimajs.dev",
	vite: {
		plugins: [tailwindcss()],
	},
	markdown: {
		shikiConfig: {
			themes: {
				light: "light-plus",
				dark: "dark-plus",
			},
			transformers: [copyButtonTransformer],
		},
	},
});
