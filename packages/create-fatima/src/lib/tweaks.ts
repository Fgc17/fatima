import { assign } from "comment-json";
import { tweakJsonConfig, tweakTextFile } from "../utils/tweak-user-config";
import type { Language } from "./types";

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
		const didIgnoreEnv = content.includes("env.ts");

		if (didIgnoreEnv) return null;

		const additions = [];

		if (content.length > 0) {
			additions.push("\n");
		}

		additions.push("# fatima", "\n", "env.ts");

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
		const didIgnoreEnv = content.includes("env.js");

		if (didIgnoreEnv) return null;

		const additions = ["\n", "# fatima", "\n", "env.js"];

		return content + additions.join("");
	});
};

export const applyUserConfigTweaks = (language: Language) => {
	const tweak = language === "typescript" ? tweakTypescript : tweakJavascript;

	tweak();
};
