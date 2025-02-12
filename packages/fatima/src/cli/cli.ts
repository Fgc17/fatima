import { program } from "commander";
import { generateAction } from "./actions/generate";
import { devAction } from "./actions/dev";
import { validateAction } from "./actions/validate";
import { runAction } from "./actions/run";
import { initAction } from "./actions/init";
import { initializeEnv } from "./utils/env-patch";
import { reloadAction } from "./actions/reload";

initializeEnv();

program
	.name("fatima")
	.description("typesafe environment variables for the js ecosystem")
	.version("0.0.0")
	.hook("postAction", () => {
		if (!process.env.npm_package_version) {
			console.log("");
		}
	});

program
	.command("generate")
	.option("-c, --config <config>", "Config file path")
	.action(async (options) => {
		await validateAction(options);

		await generateAction(options);
	});

program
	.command("dev")
	.option("-l, --lite", "Lite mode, won't generate client")
	.argument("<command...>", "The command to execute after --")
	.action(async (args, options) => {
		await validateAction(options);

		await devAction(options, args);
	});

program
	.command("run")
	.argument("<command...>", "The command to execute after --")
	.action(async (args, options) => {
		await validateAction(options);

		await runAction(options, args);
	});

program.command("validate").action(validateAction);

program.command("reload").action(reloadAction);

program.command("init").action(initAction);

program.parse();
