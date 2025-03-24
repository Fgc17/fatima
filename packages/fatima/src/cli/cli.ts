#!/usr/bin/env node
import { program } from "commander";
import { generateAction } from "./actions/generate";
import { devAction } from "./actions/dev";
import { validateAction } from "./actions/validate";
import { runAction } from "./actions/run";
import { reloadAction } from "./actions/reload";
import { initializeEnv } from "lib/env/patch-env";
import { finishLog } from "lib/logger";

initializeEnv();

program
	.name("fatima")
	.version("0.0.22")
	.description("safe environment variables for the js ecosystem")
	.configureHelp({
		showGlobalOptions: true,
	})
	.option("-d, --debug", "turn on debug mode")
	.option(
		"-c, --config <config>, --config=<config>",
		"customize config file path",
	)
	.option(
		"-e, --environment <env>, --environment=<env>",
		"overwrite your environment function",
	)
	.option("--process-env", "load only from process.env")
	.argument("<run-script...>", "the script to execute after --")
	.action(runAction);

program.command("generate").alias("g").action(generateAction);

program.command("validate").alias("v").action(validateAction);

program
	.command("run")
	.argument("<script...>", "The script to execute after --")
	.action(runAction);

program
	.command("dev")
	.alias("d")
	.option("-l, --lite", "Lite mode, won't generate client")
	.argument("<command...>", "The command to execute after --")
	.action(devAction);

program.command("reload").action(reloadAction);

program.command("help").alias("h").action(program.help);

process.on("exit", finishLog);

program.parse();
