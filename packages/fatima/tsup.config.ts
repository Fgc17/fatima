import { defineConfig, type Options } from "tsup";

const createEntries = (...entries: string[]) => {
	return entries.map((entry) => {
		return `src/${entry}/${entry}.ts`;
	});
};

export default defineConfig((opts) => {
	const minify: Options = {
		minify: "terser",
		treeshake: true,
	};

	const watch: Options = {
		watch: true,
	};

	const config: Options = {
		entry: createEntries("core", "cli", "env", "heaven"),
		dts: true,
		shims: true,
		clean: true,
		removeNodeProtocol: false,
	};

	if (opts.env?.mode === "bundle") {
		Object.assign(config, minify);
	}

	if (opts.env?.mode === "dev") {
		Object.assign(config, watch);
	}

	return config;
});
