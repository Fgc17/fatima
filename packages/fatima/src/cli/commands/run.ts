import type { RuntimeProvider } from "../../api";
import { run } from "../../api";
import { FatimaError } from "../../lib/error";
import { BaseCommand } from "../base-command";
import { logger } from "../logger";

export default class Run extends BaseCommand<typeof Run> {
	static description = "Run a command with Fatima-loaded environment variables";

	static strict = false;

	public async run(): Promise<void> {
		const args = [...((this as unknown as { argv: string[] }).argv ?? [])];

		if (args.length === 0) {
			throw new FatimaError("Missing command. Example: fatima node index.js");
		}

		const result = await run(args, {
			config: this.flags.config,
			debug: this.flags.debug,
			environment: this.flags.environment,
			provider: this.flags.provider as RuntimeProvider | undefined,
			publicPrefix: this.flags["public-prefix"],
			processEnv: this.flags["process-env"],
		});

		logger.info(
			`Loaded ${Object.keys(result.loadedEnv).length} vars for ${result.environment}.`,
		);

		if (result.exitCode !== 0) {
			throw new FatimaError(`Command exited with code ${result.exitCode}.`, {
				exitCode: result.exitCode,
			});
		}
	}
}
