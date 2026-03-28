import type { Adapter, Language, Validator } from "./types";

export interface PresetDefinition {
	dependencies: string[];
	tsImports?: string[];
	jsImports?: string[];
	helpers?: string[];
	configFields?: string[];
}

export interface ScaffoldPlan {
	language: Language;
	dependencies: string[];
	imports: string[];
	helpers: string[];
	configFields: string[];
	outputFile: string;
}

const basePresets: Record<Language, PresetDefinition> = {
	typescript: {
		dependencies: ["fatima"],
		tsImports: ['import { config } from "fatima";'],
		configFields: [
			'environment: (processEnv) => processEnv.NODE_ENV ?? "development"',
		],
	},
	javascript: {
		dependencies: ["fatima"],
		jsImports: ['const { config } = require("fatima");'],
		configFields: [
			'environment: (processEnv) => processEnv.NODE_ENV ?? "development"',
		],
	},
};

const adapterPresets: Record<Adapter, Record<Language, PresetDefinition>> = {
	local: {
		typescript: {
			dependencies: [],
			tsImports: ['import { providers } from "fatima";'],
			configFields: ['providers: { development: providers.local(".env") }'],
		},
		javascript: {
			dependencies: [],
			jsImports: ['const { providers } = require("fatima");'],
			configFields: ['providers: { development: providers.local(".env") }'],
		},
	},
	infisical: {
		typescript: {
			dependencies: ["@infisical/sdk"],
			tsImports: ['import { providers } from "fatima";'],
			configFields: [
				'providers: { development: [providers.local(".env"), providers.infisical()] }',
			],
		},
		javascript: {
			dependencies: ["@infisical/sdk"],
			jsImports: ['const { providers } = require("fatima");'],
			configFields: [
				'providers: { development: [providers.local(".env"), providers.infisical()] }',
			],
		},
	},
	vercel: {
		typescript: {
			dependencies: [],
			tsImports: ['import { providers } from "fatima";'],
			configFields: ["providers: { development: providers.vercel() }"],
		},
		javascript: {
			dependencies: [],
			jsImports: ['const { providers } = require("fatima");'],
			configFields: ["providers: { development: providers.vercel() }"],
		},
	},
	custom: {
		typescript: {
			dependencies: [],
			configFields: [
				[
					"providers: {",
					"  development: {",
					"    async fetch() {",
					'      return { NODE_ENV: "development" };',
					"    },",
					"  },",
					"}",
				].join("\n"),
			],
		},
		javascript: {
			dependencies: [],
			configFields: [
				[
					"providers: {",
					"  development: {",
					"    async fetch() {",
					'      return { NODE_ENV: "development" };',
					"    },",
					"  },",
					"}",
				].join("\n"),
			],
		},
	},
};

const validatorPresets: Record<
	Validator,
	Record<Language, PresetDefinition>
> = {
	custom: {
		typescript: {
			dependencies: [],
			tsImports: ['import type { StandardSchemaV1 } from "fatima";'],
			configFields: [
				[
					"validate: {",
					'  "~standard": {',
					"    version: 1,",
					'    vendor: "custom",',
					"    async validate(env) {",
					"      if (!env.NODE_ENV) {",
					"        return {",
					"          issues: [",
					"            {",
					'              message: "NODE_ENV is required",',
					'              path: ["NODE_ENV"],',
					"            },",
					"          ],",
					"        } satisfies StandardSchemaV1.FailureResult;",
					"      }",
					"",
					"      return { value: env };",
					"    },",
					"  },",
					"}",
				].join("\n"),
			],
		},
		javascript: {
			dependencies: [],
			configFields: [
				[
					"validate: {",
					'  "~standard": {',
					"    version: 1,",
					'    vendor: "custom",',
					"    async validate(env) {",
					"      if (!env.NODE_ENV) {",
					"        return {",
					'          issues: [{ message: "NODE_ENV is required", path: ["NODE_ENV"] }],',
					"        };",
					"      }",
					"",
					"      return { value: env };",
					"    },",
					"  },",
					"}",
				].join("\n"),
			],
		},
	},
	zod: {
		typescript: {
			dependencies: ["zod"],
			tsImports: [
				'import { z, type ZodType } from "zod";',
				'import type { EnvRecord } from "env";',
			],
			helpers: [
				"type Constraint = Partial<EnvRecord<ZodType>>;",
				"",
				"const constraint: Constraint = {",
				'  NODE_ENV: z.enum(["development"]),',
				"};",
			],
			configFields: ["validate: z.object(constraint)"],
		},
		javascript: {
			dependencies: ["zod"],
			jsImports: ['const { z } = require("zod");'],
			helpers: [
				"/**",
				" * @type {import('#env').Constraint}",
				" */",
				"const constraint = {",
				'  NODE_ENV: z.enum(["development"]),',
				"};",
			],
			configFields: ["validate: z.object(constraint)"],
		},
	},
};

export function createScaffoldPlan({
	language,
	adapter,
	validator,
}: {
	language: Language;
	adapter: Adapter;
	validator: Validator;
}): ScaffoldPlan {
	const basePreset = basePresets[language];
	const adapterPreset = adapterPresets[adapter][language];
	const validatorPreset = validatorPresets[validator][language];

	return {
		language,
		dependencies: Array.from(
			new Set([
				...basePreset.dependencies,
				...adapterPreset.dependencies,
				...validatorPreset.dependencies,
			]),
		),
		imports: Array.from(
			new Set([
				...((language === "typescript"
					? basePreset.tsImports
					: basePreset.jsImports) ?? []),
				...((language === "typescript"
					? adapterPreset.tsImports
					: adapterPreset.jsImports) ?? []),
				...((language === "typescript"
					? validatorPreset.tsImports
					: validatorPreset.jsImports) ?? []),
			]),
		),
		helpers: [
			...(basePreset.helpers ?? []),
			...(adapterPreset.helpers ?? []),
			...(validatorPreset.helpers ?? []),
		],
		configFields: [
			...(basePreset.configFields ?? []),
			...(adapterPreset.configFields ?? []),
			...(validatorPreset.configFields ?? []),
		],
		outputFile: `env.config.${language === "typescript" ? "ts" : "js"}`,
	};
}
