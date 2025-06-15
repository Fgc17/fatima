import { extname } from "node:path";
import type {
	FatimaClientOptions,
	FatimaEnvironmentFunction,
	FatimaLoadObject,
	FatimaValidator,
} from "lib/types";
import { getCallerLocation } from "lib/utils/get-caller-location";
import { wording } from "lib/wording";
import { FATIMA_DEFAULT_HEAVEN_PORT } from "../constants/port";
import { markConfig } from "./utils";

export type FatimaOptions<PublicPrefix extends string> = {
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
	 * An optional function to validate the loaded environment variables.
	 *
	 * @type {FatimaValidator | undefined}
	 */
	validate?: FatimaValidator;

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

export function config<PublicPrefix extends string>({
	load,
	environment,
	validate,
	client,
	heaven,
}: FatimaOptions<PublicPrefix>) {
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
		validate,
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
