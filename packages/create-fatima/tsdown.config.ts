import { defineConfig, nodeLib } from "@fatima/config/tsdown";

export default defineConfig(
	nodeLib({
		entry: ["@/bin.ts"],
	}),
);
