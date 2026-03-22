import { getConfigLanguage } from "../config/config-language";
import type { UnsafeEnvironmentVariables } from "../types";
import { txt } from "../utils/txt";
import preamble from "./preamble?raw";
import preambleTypes from "./preamble-types?raw";

const ifThenString = <T>(condition: T, Then = "", Else = "") =>
	condition ? Then : Else;

export const content = (params: {
	createEnvArg: string;
	publicPrefix: string;
	env: UnsafeEnvironmentVariables;
	hasValidator: boolean;
	configPath: string;
}) => {
	const { module, lang } = getConfigLanguage(params.configPath);

	const hasValidator = params.hasValidator;

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

	const preambleTypesContent = (preambleTypes as string)
		.replace(
			"type EnvObject = any;",
			`type EnvObject = {${keys.map((key) => `"${key}": string;`).join("\n  ")}} ${ifThenString(hasValidator, "& typeof Config.$envType.all")} \n`,
		)
		.replaceAll("<PUBLIC_>", params.publicPrefix ?? "PUBLIC_");

	const preambleContent = preamble;

	const configPath = params.configPath ?? "./env.config";

	return [
		ifThenString(isTs, "// @ts-nocheck"),

		ifThenString(isTs, 'import type Config from "./env.config"'),

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
		"",

		ifThenString(
			isJs,
			`/** @type { ${ifThenString(hasValidator, `typeof import("${configPath}").$envType.private &`)} PrivateEnv } */`,
		),
		`const env = createEnv(${params.createEnvArg}) ${ifThenString(isTs, " as Env")}`,
		"",

		ifThenString(
			publicEnvs.length,
			txt(
				ifThenString(
					isJs,
					`/** @type { ${ifThenString(hasValidator, `typeof import("${configPath}").$envType.public &`)} PublicEnv } */`,
				),
				`const publicEnv = createPublicEnv(${publicEnvsObject}) ${ifThenString(isTs, " as PublicEnv")}`,
			),
		),
		"",

		`${isCjs ? "module.exports = " : "export"} { env, ${ifThenString(publicEnvs.length, "publicEnv")} }`,
	];
};
