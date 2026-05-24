import path from "node:path";
import ora from "ora";
import { generate } from "../../api";
import { BaseCommand } from "../base-command";
import { chalk, logger } from "../logger";

export default class Generate extends BaseCommand<typeof Generate> {
	static description = "Generate env.ts from your configured environment";

	public async run(): Promise<void> {
		const spin = ora({
			text: "Loading environment...",
			spinner: "dots",
		}).start();

		const result = await generate({
			config: this.flags.config,
			debug: this.flags.debug,
			environment: this.flags.environment,
			publicPrefix: this.flags["public-prefix"],
			processEnv: this.flags["process-env"],
			strict: this.flags.strict,
		});

		spin.succeed(
			`Generated ${chalk.cyan(path.relative(process.cwd(), result.outputPath))}`,
		);

		logger.dim(
			`Environment: ${result.environment} (${Object.keys(result.loadedEnv).length} vars)`,
		);
	}
}
