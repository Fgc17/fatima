import ora from "ora";
import { BaseCommand } from "../base";
import { loadEnvironment } from "../lib/env/load-env";
import { logger } from "../lib/logger";
import { validateEnvironment } from "../lib/validate-environment";

export default class Validate extends BaseCommand<typeof Validate> {
	static description = "Validate your environment using env.config.*";

	public async run(): Promise<void> {
		const spin = ora({
			text: "Loading environment...",
			spinner: "dots",
		}).start();
		const result = await loadEnvironment(this.cfg, {
			environment: this.flags.environment,
			useProcessEnv: this.flags["process-env"],
		});

		spin.text = "Validating environment...";
		await validateEnvironment(this.cfg, result.env);
		spin.succeed("Environment is valid.");
		logger.dim(`Environment: ${result.environment}`);
	}
}
