import { assign } from "comment-json";
import { tweakJsonConfig, tweakTextFile } from "../utils/tweak-user-config";
import type { Generator } from "./types";

const tweakTypescript = () => {
	tweakJsonConfig("tsconfig.json", (config) => {
		if (!config.compilerOptions) {
			config.compilerOptions = {
				baseUrl: ".",
				paths: {
					env: ["./env.ts"],
				},
			};

			return config;
		}

		config.compilerOptions = assign(config.compilerOptions, {
			baseUrl: config.compilerOptions.baseUrl ?? ".",
			paths: assign(config.compilerOptions?.paths, {
				env: ["./env.ts"],
			}),
		});

		return config;
	});

	tweakTextFile(".gitignore", (content) => {
		if (content.includes("env.ts")) return null;
		const additions = content.length > 0 ? ["\n", "# fatima", "\n", "env.ts"] : ["# fatima", "\n", "env.ts"];
		return content + additions.join("");
	});
};

const tweakJavascript = () => {
	tweakJsonConfig("jsconfig.json", (config) => {
		if (!config.compilerOptions) {
			config.compilerOptions = {
				baseUrl: ".",
				paths: {
					"#env": ["./env.js"],
				},
			};

			return config;
		}

		config.compilerOptions = assign(config.compilerOptions, {
			baseUrl: config.compilerOptions.baseUrl ?? ".",
			paths: assign(config.compilerOptions?.paths, {
				"#env": ["./env.js"],
			}),
		});

		return config;
	});

	tweakJsonConfig("package.json", (config) => {
		config.imports = {
			...config.imports,
			"#env": "./env.js",
		};
		return config;
	});

	tweakTextFile(".gitignore", (content) => {
		if (content.includes("env.js")) return null;
		const additions = content.length > 0 ? ["\n", "# fatima", "\n", "env.js"] : ["# fatima", "\n", "env.js"];
		return content + additions.join("");
	});
};

const tweakPython = () => {
	tweakTextFile(".gitignore", (content) => {
		if (content.includes("env.py")) return null;
		const additions = content.length > 0 ? ["\n", "# fatima", "\n", "env.py"] : ["# fatima", "\n", "env.py"];
		return content + additions.join("");
	});
};

export const applyUserConfigTweaks = (generator: Generator) => {
	if (generator === "typescript") {
		return tweakTypescript();
	}

	if (generator === "javascript") {
		return tweakJavascript();
	}

	return tweakPython();
};
