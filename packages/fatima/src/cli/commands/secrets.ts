import { Flags } from "@oclif/core";
import { interpolateString } from "../../config/interpolate";
import {
	getSecretManagerSettings,
	listSecretsWithAccessKey,
	resolveDefaultAccessKey,
} from "../../vault/api";
import { BaseCommand } from "../base-command";
import { logger } from "../logger";
import { promptAccessKey, promptEnvironment } from "../prompts";

export default class Secrets extends BaseCommand<typeof Secrets> {
	static description = "Read secrets from the local encrypted Fatima vault";

	static flags = {
		key: Flags.string({
			description: "Fatima access key or {env:NAME} interpolation",
		}),
		reveal: Flags.boolean({
			description: "Reveal secret values in output",
			default: false,
		}),
	};

	public async run(): Promise<void> {
		const project = getSecretManagerSettings(this.flags.config);
		const environment =
			this.flags.environment ??
			(await promptEnvironment(
				project.environments,
				project.defaultEnvironment,
			));
		const rawKey =
			resolveDefaultAccessKey(this.flags.key) ?? (await promptAccessKey());
		const key = interpolateString(
			rawKey,
			process.env as Record<string, string>,
		);
		const result = listSecretsWithAccessKey(key, {
			config: this.flags.config,
			environment,
		});

		logger.success(
			`Loaded ${Object.keys(result.secrets).length} secrets from ${result.environment}.`,
		);
		for (const [secretKey, secretValue] of Object.entries(
			result.secrets as Record<string, string>,
		).sort(([left], [right]) => left.localeCompare(right))) {
			logger.line(
				`${secretKey}=${this.flags.reveal ? secretValue : "*".repeat(Math.max(8, Math.min(secretValue.length, 16)))}`,
			);
		}
	}
}
