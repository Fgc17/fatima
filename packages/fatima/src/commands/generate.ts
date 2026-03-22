import path from "node:path";
import ora from "ora";
import { BaseCommand } from "../base";
import { generateClient } from "../lib/client/generate";
import { loadEnvironment } from "../lib/env/load-env";
import { chalk, logger } from "../lib/logger";
import { validateEnvironment } from "../lib/validate-environment";

export default class Generate extends BaseCommand<typeof Generate> {
	static description = "Generate env.ts from your configured environment";

	public async run(): Promise<void> {
		const spin = ora({
			text: "Loading environment...",
			spinner: "dots",
		}).start();

		const result = await loadEnvironment(this.cfg, {
			environment: this.flags.environment,
			useProcessEnv: this.flags["process-env"],
		});

		if (this.flags.strict && this.cfg.validate) {
			spin.text = "Validating environment...";
			await validateEnvironment(this.cfg, result.env);
		}

		spin.text = "Generating env client...";
		const outputPath = await generateClient(this.cfg, result.loadedEnv);
		spin.succeed(
			`Generated ${chalk.cyan(path.relative(process.cwd(), outputPath))}`,
		);

		logger.dim(
			`Environment: ${result.environment} (${Object.keys(result.loadedEnv).length} vars)`,
		);
	}
}
