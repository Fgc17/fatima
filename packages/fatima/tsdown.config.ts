import { defineConfig, nodeLib } from "@fatima/config/tsdown";

const cli = nodeLib({
	entry: ["src/exports/cli.ts"],
	dts: false,
	banner: { js: "#!/usr/bin/env node" },
});

const runtime = nodeLib({
	entry: ["src/exports/runtime.ts"],
	clean: false,
});

const register = nodeLib({
	entry: ["src/exports/register.ts"],
	clean: false,
});

const api = nodeLib({
	entry: ["src/exports/api.ts"],
	clean: false,
});

const plugin = nodeLib({
	entry: ["src/exports/plugin.ts"],
	clean: false,
});

const plugins = nodeLib({
	entry: ["src/exports/eslint.ts"],
	clean: false,
	copy: [{ from: "src/plugins/biome.grit", rename: "biome.grit" }],
});

export default defineConfig([cli, runtime, register, api, plugin, plugins]);
