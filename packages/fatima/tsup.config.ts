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

	const config: Options = {
		entry: createEntries("core", "cli", "env", "heaven"),
		dts: true,
		shims: true,
		clean: true,
		removeNodeProtocol: false,
	};

	if (!opts.watch) {
		Object.assign(config, minify);
	}

	return config;
});
