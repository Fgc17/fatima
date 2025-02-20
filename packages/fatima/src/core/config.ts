import path from "node:path";
import type {
	FatimaClientOptions,
	FatimaEnvironment,
	FatimaEnvironmentFunction,
	FatimaLoadObject,
	FatimaValidator,
} from "./types";
import { getCallerLocation } from "src/lib/utils/get-caller-location";
import { lifecycle } from "./lifecycle";
import { FATIMA_DEFAULT_HEAVEN_PORT } from "src/lib/constants/port";

export type FatimaOptions<
	Environments extends FatimaEnvironment = FatimaEnvironment,
> = {
	/**
	 * Anything you return here will become your environment variables
	 */
	load: FatimaLoadObject<Environments>;
	/**
	 * The environment to pull the variables from, will be used in the load object.
	 */
	environment: FatimaEnvironmentFunction;
	/**
	 * Environment options
	 */
	client?: FatimaClientOptions;
	/**
	 * Function that will validate the environment variables
	 */
	validate?: FatimaValidator;
	/**
	 * A port number or 'false' to disable heaven
	 */
	heaven?: number | false;
};

export type FatimaConfig = ReturnType<typeof config>;

export function config<Environments extends FatimaEnvironment>({
	load,
	environment,
	validate,
	client,
	heaven,
}: FatimaOptions<Environments>) {
	if (!environment) {
		return lifecycle.error.missingEnvironmentConfig();
	}

	const { filePath: configFilePath, folderPath: configFolderPath } =
		getCallerLocation();

	const configExtension = path.extname(configFilePath);

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

export const markConfig = <T>(config: T) => {
	return {
		...config,
		fatimaConfigMarker: true,
	};
};

export const isFatimaConfig = (
	config: FatimaConfig,
): config is FatimaConfig => {
	return config.fatimaConfigMarker ?? false;
};
