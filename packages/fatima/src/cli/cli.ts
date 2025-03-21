#!/usr/bin/env node
import { program } from "commander";
import { generateAction } from "./actions/generate";
import { devAction } from "./actions/dev";
import { validateAction } from "./actions/validate";
import { runAction } from "./actions/run";
import { reloadAction } from "./actions/reload";
import { initializeEnv } from "lib/env/patch-env";
import { finishLog } from "lib/logger";
import { commander } from "./utils/commander";

initializeEnv();

program
	.name("fatima")
	.version("0.0.22")
	.description("safe environment variables for the js ecosystem");

const command = commander(program, (base) =>
	base
		.option("-c, --config <config>, --config=<config>", "Config file path")
		.option(
			"-e, --environment <env>, --environment=<env>",
			"Environment variables",
		)
		.option("-d, --debug", "Debug mode"),
);

command("generate").alias("g").action(generateAction);

command("validate").alias("v").action(validateAction);

command("run")
	.argument("<script...>", "The script to execute after --")
	.action(runAction);

command("dev")
	.alias("d")
	.option("-l, --lite", "Lite mode, won't generate client")
	.argument("<command...>", "The command to execute after --")
	.action(devAction);

command("reload").action(reloadAction);

command("help")
	.alias("h")
	.action(() => {
		program.help();
	});

command()
	.argument("<run-script...>", "The script to execute after --")
	.action(runAction);

process.on("exit", finishLog);

program.parse();
