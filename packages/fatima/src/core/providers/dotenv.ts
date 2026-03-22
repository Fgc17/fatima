import type {
	FatimaProvider,
	UnsafeEnvironmentVariables,
} from "../../lib/types";

export type DotenvConfigOptionsMock = {
	path: string | string[] | URL;
};

export interface DotenvMock {
	config: (config?: DotenvConfigOptionsMock) => {
		parsed?: unknown;
	};
}

export const dotenv = (
	dotenv: DotenvMock,
	config?: DotenvConfigOptionsMock,
): FatimaProvider => {
	return {
		fetch() {
			return (dotenv.config(config).parsed ?? {}) as UnsafeEnvironmentVariables;
		},
	};
};
