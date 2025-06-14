import { defineConfig, type Options } from "tsup";
import { rawImportPlugin } from "./plugins/esbuild-raw-import-plugin";

const createEntries = (...entries: string[]) => {
	return entries.map((entry) => {
		return `src/${entry}/${entry}.ts`;
	});
};

export default defineConfig((opts) => {
	const config: Options = {
		entry: createEntries("core", "cli", "register"),
		dts: true,
		shims: true,
		clean: true,
		platform: "node",
		removeNodeProtocol: false,
		esbuildPlugins: [rawImportPlugin()],
		external: ["prettier", "@biomejs/biome"],
	};

	const release: Options = {
		minify: "terser",
		treeshake: true,
		terserOptions: {
			compress: {
				passes: 3,
			},
		},
	};

	const dev: Options = {
		watch: true,
		sourcemap: true,
	};

	if (opts.env?.mode === "release") {
		Object.assign(config, release);
	}

	if (opts.env?.mode === "dev") {
		Object.assign(config, dev);
	}

	return config;
});
