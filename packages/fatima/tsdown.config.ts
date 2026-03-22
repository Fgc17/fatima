import { defineConfig, nodeLib } from "@fatima/config/tsdown";
import Raw from "unplugin-raw/rolldown";

const cli = nodeLib({
	entry: ["src/index.ts"],
	dts: false,
	banner: { js: "#!/usr/bin/env node" },
	plugins: [Raw()],
});

const runtime = nodeLib({
	entry: ["src/runtime.ts"],
	clean: false,
	plugins: [Raw()],
});

const register = nodeLib({
	entry: ["src/register.ts"],
	clean: false,
	plugins: [Raw()],
});

export default defineConfig([cli, runtime, register]);
