import { Flags } from "@oclif/core";
import {
	generateSecondaryAccessKey,
	getSecretManagerSettings,
	resolveDefaultVaultPassword,
} from "../../vault/api";
import { BaseCommand } from "../base-command";
import { logger } from "../logger";
import {
	promptAccessKeyEnvironments,
	promptAccessKeyName,
	promptVaultPassword,
} from "../prompts";

export default class Keygen extends BaseCommand<typeof Keygen> {
	static description = "Generate a secondary Fatima access key";

	static flags = {
		password: Flags.string({
			description: "Vault password or FATIMA_PASSWORD",
		}),
		config: BaseCommand.baseFlags.config,
	};

	public async run(): Promise<void> {
		const project = getSecretManagerSettings(this.flags.config);
		const password =
			resolveDefaultVaultPassword(this.flags.password) ??
			(await promptVaultPassword());
		const name = await promptAccessKeyName();
		const environments = await promptAccessKeyEnvironments(
			project.environments,
			project.defaultEnvironment,
		);
		const result = generateSecondaryAccessKey(password, name, environments, {
			config: this.flags.config,
		});

		logger.success(`Generated ${result.record.name}. Save this key now:`);
		logger.line(result.key);
	}
}
