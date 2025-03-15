import path from "node:path";

export default {
	test: {
		globals: true,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
};
