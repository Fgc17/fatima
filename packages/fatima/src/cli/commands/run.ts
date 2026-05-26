import { run } from "../../api";
import { resolveConfigPath } from "../../config/resolve-config-path";
import { FatimaError } from "../../lib/error";
import { BaseCommand } from "../base-command";

export default class Run extends BaseCommand<typeof Run> {
	static description = "Run a command with Fatima-loaded environment variables";

	static strict = false;

	public async run(): Promise<void> {
		const args = [...this.parsedArgv];

		if (args[0] === "--") {
			args.shift();
		}

		resolveConfigPath(this.flags.config);

		if (args.length === 0) {
			throw new FatimaError("Missing command. Example: fatima bun index.ts");
		}

		const result = await run(args, {
			config: this.flags.config,
			debug: this.flags.debug,
			environment: this.flags.environment,
			log: true,
			publicPrefix: this.flags["public-prefix"],
			processEnv: this.flags["process-env"],
		});

		if (result.exitCode !== 0) {
			throw new FatimaError(`Command exited with code ${result.exitCode}.`, {
				exitCode: result.exitCode,
			});
		}
	}
}
