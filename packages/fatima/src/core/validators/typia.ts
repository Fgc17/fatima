import type { FatimaValidator, UnsafeEnvironmentVariables } from "../types";
import type { AnyType } from "src/lib/types";
import { transpileConfig } from "src/cli/utils/transpile-config";
import { InternalFatimaTempFolderName } from "src/lib/tmp";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fatimaStore } from "src/lib/store/store";

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

export const typia = (fn: TypiaFunction): FatimaValidator => {
	return async (env: AnyType) => {
		let configPath =
			fatimaStore.get("fatimaTransformedConfigPath") ??
			fatimaStore.get("fatimaConfigPath");

		const isReadingTransformedConfig = configPath.includes(
			InternalFatimaTempFolderName,
		);

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
			`${InternalFatimaTempFolderName}-${Date.now()}`,
		);
		await fs.mkdir(tempFolderPath);

		const tempConfigPath = path.join(tempFolderPath, path.basename(configPath));

		await fs.copyFile(configPath, tempConfigPath);

		const tempTypiaOutputPath = path.join(tempFolderPath, "dist");
		await fs.mkdir(tempTypiaOutputPath);

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

		await new Promise<void>((resolve, reject) => {
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

		const transformedConfig = await transpileConfig(configPath);

		fatimaStore.set("fatimaTransformedConfigPath", configPath);

		const validate = transformedConfig.validate as FatimaValidator;

		const result = validate(env);

		await fs.rm(tempFolderPath, { recursive: true });

		return result;
	};
};
