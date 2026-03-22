import { BaseCommand } from "../base";
import { loadEnvironment } from "../lib/env/load-env";
import { FatimaError } from "../lib/errors";
import { runCommand } from "../lib/exec";
import { logger } from "../lib/logger";

export default class Run extends BaseCommand<typeof Run> {
	static description = "Run a command with Fatima-loaded environment variables";

	static strict = false;

	public async run(): Promise<void> {
		const args = [...((this as unknown as { argv: string[] }).argv ?? [])];

		if (args.length === 0) {
			throw new FatimaError(
				"Missing command. Example: fatima run node index.js",
			);
		}

		const result = await loadEnvironment(this.cfg, {
			environment: this.flags.environment,
			useProcessEnv: this.flags["process-env"],
		});

		logger.info(
			`Loaded ${Object.keys(result.loadedEnv).length} vars for ${result.environment}.`,
		);

		const exitCode = await runCommand(args, {
			env: result.env,
		});

		if (exitCode !== 0) {
			throw new FatimaError(`Command exited with code ${exitCode}.`, {
				exitCode,
			});
		}
	}
}
