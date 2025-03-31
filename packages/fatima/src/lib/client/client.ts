import type { FatimaClientOptions } from "lib/types";
import { txt } from "../utils/txt";
import preamble from "./preamble/preamble?raw";
import preambleTypes from "./preamble/types?raw";

const ifstring = <T>(condition: T, Then = "", Else = "") =>
	condition ? Then : Else;

const content = (blueprint: {
	envs: string[];
	createEnvArg: string;
	module: "cjs" | "esm";
	lang: "ts" | "js";
	publicPrefix?: string;
}) => {
	const privateEnvs = blueprint.envs.filter(
		(key) => !blueprint.publicPrefix || !key.startsWith(blueprint.publicPrefix),
	);

	const publicEnvs = blueprint.envs.filter(
		(key) => blueprint.publicPrefix && key.startsWith(blueprint.publicPrefix),
	);

	const isJs = blueprint.lang === "js";

	const isTs = !isJs;

	const exportDeclaration =
		blueprint.module === "cjs" ? "module.exports = " : "export";

	const exportObject = `{ env${ifstring(publicEnvs.length, ", publicEnv")} }`;

	const preambleTypesContent = (preambleTypes as string)
		.replace(
			"export type EnvObject = AnyType;",
			`export interface EnvObject {${blueprint.envs.map((key) => `"${key}": string;`).join("\n  ")}}\n`,
		)
		.replaceAll("<PUBLIC_>", blueprint.publicPrefix ?? "PUBLIC_");

	const preambleContent = preamble.split("\n").slice(1).join("\n");

	return [
		ifstring(isTs, "// @ts-nocheck"),

		ifstring(
			isJs,
			txt(
				"/** @typedef {Object} Env",
				privateEnvs.map((key) => ` * @property {string} ${key}`).join("\n"),
				" */",
				"",
			),
		),

		ifstring(
			isJs && publicEnvs.length,
			txt(
				"/** @typedef {Object} PublicEnv",
				publicEnvs.map((key) => ` * @property {string} ${key}`).join("\n"),
				" */",
				"",
			),
		),

		ifstring(
			isJs,
			txt(
				"/** @typedef {Object} Constraint",
				blueprint.envs.map((key) => ` * @property {any} ${key}`).join("\n"),
				" */",
				"",
			),
		),

		ifstring(isTs, preambleTypesContent),

		preambleContent,
		"",

		ifstring(isJs, "/** @type { Env } */"),
		`const env = createEnv(${blueprint.createEnvArg}) ${ifstring(isTs, " as Env")}`,
		"",

		ifstring(
			publicEnvs.length,
			txt(
				ifstring(isJs, "/** @type { PublicEnv } */"),
				`const publicEnv = createPublicEnv(${txt(
					"  {",
					`  publicPrefix: "${blueprint.publicPrefix}",`,
					`  publicVariables: {${publicEnvs
						.map((key) => `    ${key}: processEnv.${key}`)
						.join(",\n")}}`,
					"}",
				)}) ${ifstring(isTs, " as PublicEnv")}`,
			),
		),
		"",

		`${exportDeclaration} ${exportObject}`,
	];
};

export function client(
	envs: string[],
	options: FatimaClientOptions & {
		module: "cjs" | "esm";
		lang: "ts" | "js";
	},
) {
	const createEnvArg = `{ isServer: ${options.isServer?.toString() ?? "undefined"} }`;

	return content({
		createEnvArg,
		envs,
		publicPrefix: options.publicPrefix,
		lang: options.lang,
		module: options.module,
	});
}
