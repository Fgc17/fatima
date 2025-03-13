import type {
	AnyType,
	FatimaValidator,
	UnsafeEnvironmentVariables,
} from "lib/types";
import { fatimaStore } from "lib/store";
import { spawn } from "node:child_process";
import { readConfig } from "lib/config/read-config";
import fs from "node:fs/promises";
import path from "node:path";

export type TypiaFunction = (env: UnsafeEnvironmentVariables) => {
	success: boolean;
	data?: AnyType;
	errors?: IError[];
};

interface IError {
	path: string;
	expected: string;
	value: AnyType;
}

const typiaTempFolderName = "eba76a2e-684c-4377-a31f-e433246df2f5";

export const typia = (fn: TypiaFunction): FatimaValidator => {
	return async (env: AnyType) => {
		let configPath =
			fatimaStore.get("transformedConfigPath") ?? fatimaStore.get("configPath");

		const isReadingTransformedConfig = configPath.includes(typiaTempFolderName);

		if (isReadingTransformedConfig) {
			const result = fn(env);

			const isValid = result.success;

			const errors =
				result.errors?.map((error) => ({
					key: error.path.replace("$input.", ""),
					message: error.expected,
				})) ?? [];

			return {
				isValid,
				errors,
			};
		}

		const configDir = path.dirname(configPath);

		const tempFolderPath = path.join(
			configDir,
			`${typiaTempFolderName}-${Date.now()}`,
		);
		await fs.mkdir(tempFolderPath);

		const tempConfigPath = path.join(tempFolderPath, path.basename(configPath));

		await fs.copyFile(configPath, tempConfigPath);

		const tempTypiaOutputPath = path.join(tempFolderPath, "dist");
		await fs.mkdir(tempTypiaOutputPath);

		await new Promise<void>((resolve, reject) => {
			const typiaCommand = "typia";
			const args = [
				"generate",
				"--input",
				tempFolderPath,
				"--output",
				tempTypiaOutputPath,
				"--project",
				"tsconfig.json",
			];

			const process = spawn(typiaCommand, args, { shell: true });

			process.stdout.on("data", () => {});

			process.stderr.on("data", () => {});

			process.on("close", (code) => {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`Process exited with code ${code}`));
				}
			});
		});

		configPath = path.join(tempTypiaOutputPath, path.basename(configPath));

		const transformedConfig = await readConfig(configPath);

		fatimaStore.set("transformedConfigPath", configPath);

		const validate = transformedConfig.validate as FatimaValidator;

		const result = validate(env);

		await fs.rm(tempFolderPath, { recursive: true });

		return result;
	};
};
