import { extname } from "node:path";
import type {
	CreatePrivateEnv,
	CreatePublicEnv,
	FatimaClientOptions,
	FatimaEnvType,
	FatimaEnvironmentFunction,
	FatimaLoadObject,
	FatimaSchema,
	FatimaSchemaType,
} from "lib/types";
import { getCallerLocation } from "lib/utils/get-caller-location";
import { wording } from "lib/wording";
import { markConfig } from "../../lib/config/utils";
import { FATIMA_DEFAULT_HEAVEN_PORT } from "../../lib/constants/port";

export type FatimaOptions<
	S extends FatimaSchemaType,
	PublicPrefix extends string,
> = {
	/**
	 * Defines how Fatima loads environment variables.
	 *
	 * This should be an object where keys represent different environments, and values
	 * are arrays of functions responsible for loading the environment variables.
	 *
	 * Fatima determines the current environment using the `environment` function
	 * and then loads variables accordingly.
	 *
	 * @type {Record<Environments, LoadFunction[]>}
	 */
	load: FatimaLoadObject;

	/**
	 * A function responsible for determining the current environment.
	 *
	 * The return value of this function should match one of the environments
	 * defined in the `load` object.
	 *
	 * @type {FatimaEnvironmentFunction}
	 */
	environment: FatimaEnvironmentFunction;

	/**
	 * Optional configuration settings for the generated client.
	 *
	 * @type {FatimaClientOptions | undefined}
	 */
	client?: FatimaClientOptions<PublicPrefix>;

	/**
	 * An optional function to specify a schema for validating environment variables.
	 *
	 * @type {FatimaSchema | undefined}
	 */
	schema?: FatimaSchema<S>;

	/**
	 * Configures the "heaven" feature, which listens on a specified port.
	 *
	 * - If set to a number, the heaven service will be enabled on that port.
	 * - If set to `false`, the feature will be disabled.
	 *
	 * @default false
	 */
	heaven?: number | false;
};

export type FatimaConfig = ReturnType<typeof config>;

export function config<
	S extends FatimaSchemaType,
	PublicPrefix extends string,
>({
	load,
	schema,
	client,
	heaven,
	environment,
}: FatimaOptions<S, PublicPrefix>) {
	if (!environment) {
		throw new Error(wording.error.missingEnvironmentConfig());
	}

	const { filePath: configFilePath, folderPath: configFolderPath } =
		getCallerLocation();

	const configExtension = extname(configFilePath);

	if (typeof heaven === "undefined") {
		heaven = FATIMA_DEFAULT_HEAVEN_PORT;
	}

	return markConfig({
		$envType: null as unknown as FatimaEnvType<S, PublicPrefix>,
		schema,
		environment,
		client,
		load,
		heaven,
		file: {
			extension: configExtension,
			path: configFilePath,
			folderPath: configFolderPath,
		},
	});
}
