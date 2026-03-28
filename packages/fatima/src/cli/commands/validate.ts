import ora from "ora";
import type { RuntimeProvider } from "../../api";
import { validate } from "../../api";
import { BaseCommand } from "../base-command";
import { logger } from "../logger";

export default class Validate extends BaseCommand<typeof Validate> {
	static description = "Validate your environment using env.config.*";

	public async run(): Promise<void> {
		const spin = ora({
			text: "Loading environment...",
			spinner: "dots",
		}).start();
		const result = await validate({
			config: this.flags.config,
			debug: this.flags.debug,
			environment: this.flags.environment,
			provider: this.flags.provider as RuntimeProvider | undefined,
			publicPrefix: this.flags["public-prefix"],
			processEnv: this.flags["process-env"],
		});

		spin.succeed("Environment is valid.");

		logger.dim(`Environment: ${result.environment}`);
	}
}
