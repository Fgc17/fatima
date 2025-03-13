import type {
	AnyType,
	FatimaBuiltInLoadFunction,
	UnsafeEnvironmentVariables,
} from "lib/types";

export type DotenvConfigOptionsMock = {
	path: string | string[] | URL;
};

export interface DotenvMock {
	config: (config?: DotenvConfigOptionsMock) => {
		parsed?: AnyType;
	};
}

const load =
	(
		dotenv: DotenvMock,
		config?: DotenvConfigOptionsMock,
	): FatimaBuiltInLoadFunction =>
	async () => {
		const env = (dotenv.config(config).parsed ??
			{}) as UnsafeEnvironmentVariables;

		return env;
	};

export const dotenv = {
	load,
};
