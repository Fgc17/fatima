import { Args, Flags } from "@oclif/core";
import { interpolateString } from "../../config/interpolate";
import {
	formatSecretsWithAccessKey,
	resolveDefaultAccessKey,
} from "../../vault/api";
import type { SecretManagerFormat } from "../../vault/types";
import { BaseCommand } from "../base-command";
import { promptAccessKey, promptSecretManagerFormat } from "../prompts";

export default class Format extends BaseCommand<typeof Format> {
	static description = "Format encrypted Fatima secrets for CI or shell usage";

	static args = {
		format: Args.string({
			required: false,
			description: "github-env | shell | dotenv | json",
		}),
	};

	static flags = {
		config: BaseCommand.baseFlags.config,
		environment: BaseCommand.baseFlags.environment,
		key: Flags.string({
			description: "Fatima access key or {env:NAME} interpolation",
		}),
	};

	public async run(): Promise<void> {
		const { args } = await this.parse(Format);
		const format =
			(args.format as SecretManagerFormat | undefined) ??
			(await promptSecretManagerFormat());
		const rawKey =
			resolveDefaultAccessKey(this.flags.key) ?? (await promptAccessKey());
		const key = interpolateString(
			rawKey,
			process.env as Record<string, string>,
		);
		const result = formatSecretsWithAccessKey(format, key, {
			config: this.flags.config,
			environment: this.flags.environment,
		});
		process.stdout.write(result.content);
	}
}
