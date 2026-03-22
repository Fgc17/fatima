import { extname } from "node:path";
import { markConfig } from "../../lib/config/utils";
import { FatimaError } from "../../lib/errors";
import type {
	FatimaClientOptions,
	FatimaEnvironmentFunction,
	FatimaEnvType,
	FatimaProviderObject,
	FatimaStandardSchema,
	InferStandardSchemaShape,
} from "../../lib/types";
import { getCallerLocation } from "../../lib/utils/get-caller-location";

export type FatimaOptions<
	Schema extends FatimaStandardSchema | undefined,
	PublicPrefix extends string,
> = {
	providers?: FatimaProviderObject;
	environment: FatimaEnvironmentFunction;
	client?: FatimaClientOptions<PublicPrefix>;
	validate?: Schema;
};

export type FatimaConfig = ReturnType<typeof config>;

export function config<
	Schema extends FatimaStandardSchema | undefined,
	PublicPrefix extends string,
>({
	providers = {},
	validate,
	client,
	environment,
}: FatimaOptions<Schema, PublicPrefix>) {
	if (typeof environment !== "function") {
		throw new FatimaError(
			"Missing config.environment. Export your config with an environment resolver.",
		);
	}

	const { filePath, folderPath } = getCallerLocation();

	return markConfig({
		$envType: null as unknown as FatimaEnvType<
			Schema extends FatimaStandardSchema
				? InferStandardSchemaShape<Schema>
				: Record<string, string>,
			PublicPrefix
		>,
		client,
		environment,
		providers,
		validate,
		file: {
			extension: extname(filePath),
			folderPath,
			path: filePath,
		},
	});
}
