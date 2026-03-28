import { extname } from "node:path";
import { FatimaError } from "../lib/error";
import { getCallerLocation } from "../lib/get-caller-location";
import type {
	FatimaClientOptions,
	FatimaEnvironmentFunction,
	FatimaEnvType,
	FatimaProviderObject,
	FatimaStandardSchema,
	InferStandardSchemaShape,
} from "./types";

export type FatimaOptions<
	Schema extends FatimaStandardSchema | undefined,
	PublicPrefix extends string,
> = {
	providers?: FatimaProviderObject;
	environment?: FatimaEnvironmentFunction;
	client?: FatimaClientOptions<PublicPrefix>;
	schema?: Schema;
};

export type FatimaConfig = ReturnType<typeof config>;

export function config<
	Schema extends FatimaStandardSchema | undefined,
	PublicPrefix extends string,
>({
	providers = {},
	schema,
	client,
	environment = () => "development",
}: FatimaOptions<Schema, PublicPrefix>) {
	if (typeof environment !== "function") {
		throw new FatimaError("config.environment must be a function.");
	}

	const { filePath, folderPath } = getCallerLocation();

	return {
		type: null as unknown as FatimaEnvType<
			Schema extends FatimaStandardSchema
				? InferStandardSchemaShape<Schema>
				: Record<string, string>,
			PublicPrefix
		>,
		client,
		environment,
		providers,
		schema,
		file: {
			extension: extname(filePath),
			folderPath,
			path: filePath,
		},
	};
}

export type * from "./types";
