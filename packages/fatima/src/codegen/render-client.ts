import { getConfigLanguage } from "../config/config-language";
import type { UnsafeEnvironmentVariables } from "../config/types";
import { txt } from "../lib/txt";
import preamble from "./raw/preamble.raw?raw";
import preambleTypes from "./raw/preamble-types.raw?raw";

const ifThenString = <T>(condition: T, Then = "", Else = "") =>
	condition ? Then : Else;

export const renderClient = (params: {
	createEnvArg: string;
	publicPrefix: string;
	env: UnsafeEnvironmentVariables;
	hasSchema: boolean;
	configPath: string;
}) => {
	const { module, lang } = getConfigLanguage(params.configPath);

	const hasSchema = params.hasSchema;

	const keys = Object.keys(params.env);

	const privateEnvs = keys.filter(
		(key) => !params.publicPrefix || !key.startsWith(params.publicPrefix),
	);

	const publicEnvs = keys.filter(
		(key) => params.publicPrefix && key.startsWith(params.publicPrefix),
	);

	const publicEnvsObject = `{${publicEnvs
		.map((key) => `    ${key}: process.env.${key}`)
		.join(",\n")}}`;

	const isJs = lang === "js";

	const isCjs = module === "cjs";

	const isTs = !isJs;

	const preambleTypesContent = preambleTypes
		.replace(
			"type EnvObject = AnyValue;",
			`type EnvObject = Prettify<{${keys.map((key) => `"${key}": string;`).join("\n  ")}} ${ifThenString(hasSchema, "& typeof Config.type.all")}> \n`,
		)
		.replaceAll("<PUBLIC_>", params.publicPrefix ?? "PUBLIC_");

	const preambleContent = preamble;

	const configPath = params.configPath ?? "./env.config";

	return [
		ifThenString(isTs, txt("// @ts-nocheck")),

		ifThenString(
			isTs && params.hasSchema,
			'import type Config from "./env.config"',
		),

		ifThenString(
			isJs,
			txt(
				"/** @typedef {Object} PrivateEnv",
				privateEnvs.map((key) => ` * @property {string} ${key}`).join("\n"),
				" */",
				"",
			),
		),

		ifThenString(
			isJs && publicEnvs.length,
			txt(
				"/** @typedef {Object} PublicEnv",
				publicEnvs.map((key) => ` * @property {string} ${key}`).join("\n"),
				" */",
				"",
			),
		),

		ifThenString(
			isJs,
			txt(
				"/** @typedef {Object} Constraint",
				keys.map((key) => ` * @property {any} ${key}`).join("\n"),
				" */",
				"",
			),
		),

		ifThenString(isTs, preambleTypesContent),

		preambleContent,

		ifThenString(
			isJs,
			`/** @type { ${ifThenString(hasSchema, `typeof import("${configPath}").type.private &`)} PrivateEnv } */`,
		),
		`const env = createEnv(${params.createEnvArg}) ${ifThenString(isTs, " as Env")}`,
		"",

		ifThenString(
			publicEnvs.length,
			txt(
				ifThenString(
					isJs,
					`/** @type { ${ifThenString(hasSchema, `typeof import("${configPath}").type.public &`)} PublicEnv } */`,
				),
				`const publicEnv = createPublicEnv(${publicEnvsObject}) ${ifThenString(isTs, " as PublicEnv")}`,
			),
		),
		"",

		`${isCjs ? "module.exports = " : "export"} { env, ${ifThenString(publicEnvs.length, "publicEnv")} }`,
	];
};
