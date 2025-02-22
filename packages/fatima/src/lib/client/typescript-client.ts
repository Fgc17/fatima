import type { FatimaClientOptions } from "../types";
import { txt } from "../utils/txt";

type ClientStrings = {
	envObject: string;
	createEnvArg: string;
	createPublicEnvArg?: string;
	publicPrefix?: string;
};

const client = (strings: ClientStrings) => [
	"import {",
	"  createEnv,",
	"  type ServerEnvRecord,",
	"  type EnvType as FatimaEnvType,",
	"  type EnvRecord as FatimaEnvRecord,",
	"  type PrimitiveEnvType as FatimaPrimitiveEnvType,",
	"} from '@fatimajs/tools/env';",
	"",

	"export interface EnvObject {",
	`  ${strings.envObject}`,
	"}",
	"",

	"export type EnvKeys = keyof EnvObject;",
	"",

	"export type EnvRecord<V = string> = FatimaEnvRecord<EnvObject, V>;",
	"",

	"type PrimitiveEnvType = FatimaPrimitiveEnvType<EnvObject>;",
	"export type EnvType<T extends PrimitiveEnvType> = FatimaEnvType<EnvObject, T>;",
	"",

	`type Env = ServerEnvRecord<EnvKeys, ${strings.publicPrefix}>`,
	"",

	`export const env = createEnv(${strings.createEnvArg}) as Env;`,
	"",

	strings.createPublicEnvArg
		? txt(
				`import { createPublicEnv, type PublicEnvRecord } from "fatima/env";`,
				`type PublicEnv = PublicEnvRecord<EnvKeys, ${strings.publicPrefix}>`,
				`export const publicEnv = createPublicEnv(${strings.createPublicEnvArg}) as PublicEnv;`,
			)
		: "",
];

export function getTypescriptClient(
	envs: string[],
	options: FatimaClientOptions = {},
) {
	const publicKeys = options.publicPrefix
		? envs.filter((e) => e.startsWith(options.publicPrefix as string))
		: [];

	let createPublicEnvArg: string | undefined = undefined;
	if (publicKeys?.length) {
		const publicVariables = `${publicKeys.map((key) => `    ${key}: process.env.${key} as string`).join(",\n")}`;

		createPublicEnvArg = txt(
			"  {",
			`  publicPrefix: "${options.publicPrefix}",`,
			"  publicVariables: {",
			`${publicVariables}`,
			"  }",
			"}",
		);
	}

	const createEnvArg = `{ isServer: ${options.isServer ? options.isServer.toString() : undefined} }`;

	const envObject = envs.map((key) => `"${key}": string;`).join("\n  ");

	const publicPrefix = options.publicPrefix
		? `"${options.publicPrefix}"`
		: `"PUBLIC_"`;

	return client({
		createEnvArg,
		createPublicEnvArg,
		envObject,
		publicPrefix,
	}).join("\n");
}
