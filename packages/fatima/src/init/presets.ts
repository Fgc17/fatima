import type { Adapter, Generator, ModelPreset } from "./types";

export interface PresetDefinition {
	dependencies: string[];
	config?: Record<string, unknown>;
	files?: Record<string, string>;
}

export interface ScaffoldPlan {
	generator: Generator;
	dependencies: string[];
	config: Record<string, unknown>;
	files: Record<string, string>;
	outputFile: string;
}

const customPluginFiles = {
	typescript: {
		"fatima.plugin.ts": [
			'import type { FatimaPlugin } from "fatima/plugin";',
			"",
			"const plugin: FatimaPlugin = {",
			"\tproviders: {",
			"\t\tcustom: () => ({",
			"\t\t\tfetch() {",
			'\t\t\t\treturn { NODE_ENV: "development" };',
			"\t\t\t},",
			"\t\t}),",
			"\t},",
			"};",
			"",
			"export default plugin;",
		].join("\n"),
	},
	javascript: {
		"fatima.plugin.js": [
			"module.exports = {",
			"\tproviders: {",
			"\t\tcustom: () => ({",
			"\t\t\tfetch() {",
			'\t\t\t\treturn { NODE_ENV: "development" };',
			"\t\t\t},",
			"\t\t}),",
			"\t},",
			"};",
		].join("\n"),
	},
	python: {
		"fatima.plugin.js": [
			"module.exports = {",
			"\tproviders: {",
			"\t\tcustom: () => ({",
			"\t\t\tfetch() {",
			'\t\t\t\treturn { ENVIRONMENT: "development" };',
			"\t\t\t},",
			"\t\t}),",
			"\t},",
			"};",
		].join("\n"),
	},
} satisfies Record<Generator, Record<string, string>>;

const basePresets: Record<Generator, PresetDefinition> = {
	typescript: {
		dependencies: ["fatima"],
		config: {
			generator: "typescript",
			environment: "{env:NODE_ENV} ?? 'development'",
			vault: {
				mode: "local",
				defaultEnvironment: "development",
				environments: ["development", "staging", "production"],
			},
		},
	},
	javascript: {
		dependencies: ["fatima"],
		config: {
			generator: "javascript",
			environment: "{env:NODE_ENV} ?? 'development'",
			vault: {
				mode: "local",
				defaultEnvironment: "development",
				environments: ["development", "staging", "production"],
			},
		},
	},
	python: {
		dependencies: ["fatima"],
		config: {
			generator: "python",
			environment: "{env:ENVIRONMENT} ?? 'development'",
			vault: {
				mode: "local",
				defaultEnvironment: "development",
				environments: ["development", "staging", "production"],
			},
		},
	},
};

const adapterPresets: Record<Adapter, Record<Generator, PresetDefinition>> = {
	local: {
		typescript: {
			dependencies: [],
			config: {
				providers: { development: [{ provider: "local", file: ".env" }] },
			},
		},
		javascript: {
			dependencies: [],
			config: {
				providers: { development: [{ provider: "local", file: ".env" }] },
			},
		},
		python: {
			dependencies: [],
			config: {
				providers: { development: [{ provider: "local", file: ".env" }] },
			},
		},
	},
	infisical: {
		typescript: {
			dependencies: ["@infisical/sdk"],
			config: {
				providers: {
					development: [
						{ provider: "local", file: ".env" },
						{ provider: "infisical" },
					],
				},
			},
		},
		javascript: {
			dependencies: ["@infisical/sdk"],
			config: {
				providers: {
					development: [
						{ provider: "local", file: ".env" },
						{ provider: "infisical" },
					],
				},
			},
		},
		python: {
			dependencies: ["@infisical/sdk"],
			config: {
				providers: {
					development: [
						{ provider: "local", file: ".env" },
						{ provider: "infisical" },
					],
				},
			},
		},
	},
	vercel: {
		typescript: {
			dependencies: [],
			config: { providers: { development: [{ provider: "vercel" }] } },
		},
		javascript: {
			dependencies: [],
			config: { providers: { development: [{ provider: "vercel" }] } },
		},
		python: {
			dependencies: [],
			config: { providers: { development: [{ provider: "vercel" }] } },
		},
	},
	custom: {
		typescript: {
			dependencies: [],
			config: {
				plugins: ["./fatima.plugin.ts"],
				providers: { development: [{ provider: "custom" }] },
			},
			files: customPluginFiles.typescript,
		},
		javascript: {
			dependencies: [],
			config: {
				plugins: ["./fatima.plugin.js"],
				providers: { development: [{ provider: "custom" }] },
			},
			files: customPluginFiles.javascript,
		},
		python: {
			dependencies: [],
			config: {
				plugins: ["./fatima.plugin.js"],
				providers: { development: [{ provider: "custom" }] },
			},
			files: customPluginFiles.python,
		},
	},
};

const modelPresets: Record<ModelPreset, Record<Generator, PresetDefinition>> = {
	custom: {
		typescript: {
			dependencies: [],
			config: { model: { NODE_ENV: "nonempty" } },
		},
		javascript: {
			dependencies: [],
			config: { model: { NODE_ENV: "nonempty" } },
		},
		python: {
			dependencies: [],
			config: { model: { ENVIRONMENT: "nonempty" } },
		},
	},
	builtin: {
		typescript: {
			dependencies: [],
			config: {
				model: {
					NODE_ENV: { type: "string", args: { values: ["development"] } },
				},
			},
		},
		javascript: {
			dependencies: [],
			config: {
				model: {
					NODE_ENV: { type: "string", args: { values: ["development"] } },
				},
			},
		},
		python: {
			dependencies: [],
			config: {
				model: {
					ENVIRONMENT: { type: "string", args: { values: ["development"] } },
				},
			},
		},
	},
};

export function createScaffoldPlan({
	generator,
	adapter,
	modelPreset,
}: {
	generator: Generator;
	adapter: Adapter;
	modelPreset: ModelPreset;
}): ScaffoldPlan {
	const basePreset = basePresets[generator];
	const adapterPreset = adapterPresets[adapter][generator];
	const modelConfigPreset = modelPresets[modelPreset][generator];

	return {
		generator,
		dependencies: Array.from(
			new Set([
				...basePreset.dependencies,
				...adapterPreset.dependencies,
				...modelConfigPreset.dependencies,
			]),
		),
		config: {
			...(basePreset.config ?? {}),
			...(adapterPreset.config ?? {}),
			...(modelConfigPreset.config ?? {}),
		},
		files: {
			...(basePreset.files ?? {}),
			...(adapterPreset.files ?? {}),
			...(modelConfigPreset.files ?? {}),
		},
		outputFile: "fatima.json",
	};
}
