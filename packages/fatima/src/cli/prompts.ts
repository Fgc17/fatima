import { checkbox, input, password, select } from "@inquirer/prompts";
import type { SecretManagerFormat } from "../vault/types";

export async function promptAccessKey(): Promise<string> {
	return password({ message: "Access key:", mask: "*" });
}

export async function promptVaultPassword(): Promise<string> {
	return password({ message: "Master password:", mask: "*" });
}

export async function promptEnvironment(
	environments: string[],
	defaultValue?: string,
): Promise<string> {
	return select({
		message: "Select environment",
		choices: environments.map((environment) => ({
			name: environment,
			value: environment,
			default: environment === defaultValue,
		})),
	});
}

export async function promptAccessKeyName(): Promise<string> {
	return input({
		message: "Access key name:",
		validate(value) {
			return value.trim().length > 0 || "Access key name cannot be empty";
		},
	});
}

export async function promptAccessKeyEnvironments(
	environments: string[],
	defaultEnvironment?: string,
): Promise<string[]> {
	return checkbox({
		message: "Select environments for this key:",
		choices: environments.map((environment) => ({
			name: environment,
			value: environment,
			checked: environment === defaultEnvironment,
		})),
	});
}

export async function promptSecretManagerFormat(): Promise<SecretManagerFormat> {
	const formats: SecretManagerFormat[] = [
		"github-env",
		"shell",
		"dotenv",
		"json",
	];

	return select<SecretManagerFormat>({
		message: "Select output format",
		choices: formats.map((value) => ({
			name: value,
			value,
		})),
	});
}
