import { defineConfig, type UserConfig } from "tsdown";

export function nodeLib({
	entry,
	dts = true,
	clean = true,
	...config
}: UserConfig): UserConfig {
	return {
		entry,
		format: ["cjs"],
		dts,
		shims: true,
		clean,
		platform: "node",
		tsconfig: "tsconfig.build.json",
		...config,
	};
}

export type { UserConfig };
export { defineConfig };
