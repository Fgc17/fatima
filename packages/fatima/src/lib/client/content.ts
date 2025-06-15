import type { UnsafeEnvironmentVariables } from "lib/types";
import { txt } from "lib/utils/txt";
import preambleTypes from "./preamble-types?raw";
import preamble from "./preamble?raw";

const ifThenString = <T>(condition: T, Then = "", Else = "") =>
	condition ? Then : Else;

export const content = (params: {
	createEnvArg: string;
	module: "cjs" | "esm";
	lang: "ts" | "js";
	publicPrefix: string;
	env: UnsafeEnvironmentVariables;
}) => {
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

	const isJs = params.lang === "js";

	const isCjs = params.module === "cjs";

	const isTs = !isJs;

	const preambleTypesContent = (preambleTypes as string)
		.replace(
			"type EnvObject = AnyType;",
			`export interface EnvObject {${keys.map((key) => `"${key}": string;`).join("\n  ")}}\n`,
		)
		.replaceAll("<PUBLIC_>", params.publicPrefix ?? "PUBLIC_");

	const preambleContent = preamble;

	return [
		ifThenString(isTs, "// @ts-nocheck"),

		ifThenString(
			isJs,
			txt(
				"/** @typedef {Object} Env",
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

		ifThenString(isJs, "/** @type { Env } */"),
		`const env = createEnv(${params.createEnvArg}) ${ifThenString(isTs, " as Env")}`,
		"",

		ifThenString(
			publicEnvs.length,
			txt(
				ifThenString(isJs, "/** @type { PublicEnv } */"),
				`const publicEnv = createPublicEnv(${publicEnvsObject}) ${ifThenString(isTs, " as PublicEnv")}`,
			),
		),
		"",

		`${isCjs ? "module.exports = " : "export"} { env, publicEnv }`,
	];
};
