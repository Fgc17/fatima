import { defineConfig, nodeLib } from "@fatima/config/tsdown";
import Raw from "unplugin-raw/rolldown";

const cli = nodeLib({
	entry: ["src/exports/cli.ts"],
	dts: false,
	banner: { js: "#!/usr/bin/env node" },
	plugins: [Raw()],
});

const runtime = nodeLib({
	entry: ["src/exports/runtime.ts"],
	clean: false,
	plugins: [Raw()],
});

const register = nodeLib({
	entry: ["src/exports/register.ts"],
	clean: false,
	plugins: [Raw()],
});

const api = nodeLib({
	entry: ["src/exports/api.ts"],
	clean: false,
	plugins: [Raw()],
});

const plugins = nodeLib({
	entry: ["src/exports/eslint.ts"],
	clean: false,
	copy: [{ from: "src/plugins/biome.grit", rename: "biome.grit" }],
	plugins: [Raw()],
});

export default defineConfig([cli, runtime, register, api, plugins]);
