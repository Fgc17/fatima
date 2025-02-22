import type { FatimaClientOptions } from "lib/types";
import { txt } from "../utils/txt";

const client = (strings: {
	envKeys: string;
	envConstraint: string;
	createEnvArg: string;
	createPublicEnvArg?: string;
	publicPrefix?: string;
}) => [
	'const { createEnv } = require("@fatimajs/tools/env");',
	"",

	"/** @typedef {Object} EnvKeys",
	strings.envKeys,
	" */",
	"",

	"/** @typedef {Object} Constraint",
	strings.envConstraint,
	" */",
	"",

	`/** @type {import('fatima/env').ServerEnvRecord<keyof EnvKeys, ${strings.publicPrefix}>} */`,
	`exports.env = createEnv(${strings.createEnvArg});`,
	"",

	strings.createPublicEnvArg
		? txt(
				`const { createPublicEnv } = require("fatima/env");`,
				"",
				`/** @type {import('fatima/env').PublicEnvRecord<keyof EnvKeys, ${strings.publicPrefix}>} */`,
				`exports.publicEnv = createPublicEnv(${strings.createPublicEnvArg});`,
			)
		: "",
];

export function getJavascriptClient(
	envs: string[],
	options: FatimaClientOptions = {},
): string {
	const publicKeys = options.publicPrefix
		? envs.filter((e) => e.startsWith(options.publicPrefix as string))
		: [];

	let createPublicEnvArg: string | undefined;
	if (publicKeys?.length) {
		const publicVariables = `${publicKeys
			.map((key) => `    ${key}: process.env.${key}`)
			.join(",\n")}`;

		createPublicEnvArg = txt(
			"  {",
			`  publicPrefix: "${options.publicPrefix}",`,
			"  publicVariables: {",
			`${publicVariables}`,
			"  }",
			"}",
		);
	}

	const createEnvArg = `{ isServer: ${options.isServer?.toString() ?? "undefined"} }`;

	const envKeys = envs
		.sort()
		.map((key) => ` * @property {string} ${key}`)
		.join("\n");

	const envConstraint = envs
		.sort()
		.map((key) => ` * @property {any} ${key}`)
		.join("\n");

	return client({
		createEnvArg,
		createPublicEnvArg,
		envKeys,
		envConstraint,
		publicPrefix: options.publicPrefix
			? `"${options.publicPrefix}"`
			: undefined,
	}).join("\n");
}
