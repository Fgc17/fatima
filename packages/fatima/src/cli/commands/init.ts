import { createInit } from "../../init/create";
import { checkPackageJson } from "../../init/utils";
import { wizard } from "../../init/wizard/wizard";
import { BaseCommand } from "../base-command";
import { chalk, logger } from "../logger";

export default class Init extends BaseCommand<typeof Init> {
	static description = "Initialize fatima.json and env access for your project";

	public async run(): Promise<void> {
		checkPackageJson();

		const { generator, adapter, modelPreset } = await wizard();
		const result = await createInit({
			adapter,
			generator,
			modelPreset,
		});

		logger.success(`Created ${chalk.cyan(result.outputFile)}`);
		logger.dim(`Install dependencies: ${result.dependencies.join(" ")}`);
		logger.dim("Next step: run `fatima generate`");
	}
}
