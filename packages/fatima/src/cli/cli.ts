import { program } from "commander";
import { generateAction } from "./actions/generate";
import { devAction } from "./actions/dev";
import { validateAction } from "./actions/validate";
import { runAction } from "./actions/run";
import { initAction } from "./actions/init";
import { initializeEnv } from "./utils/env-patch";

initializeEnv();

program
  .name("fatima")
  .description("typesafe environment variables for the js ecosystem")
  .version("0.0.0");

program
  .command("generate")
  .option("-c, --config <config>", "Config file path")
  .action(async (options) => {
    await validateAction(options);

    await generateAction(options);
  });

program
  .command("validate")
  .option("-c, --config <config>", "Config file path")
  .action(validateAction);

program
  .command("dev")
  .option("-c, --config <config>", "Config file path")
  .option("-p, --port <port>", "Open a port for hot reloading")
  .argument("<command...>", "The command to execute after --")
  .action(async (args, options) => {
    await validateAction(options);

    await devAction(options, args);
  });

program
  .command("run")
  .option("-c, --config <config>", "Config file path")
  .argument("<command...>", "The command to execute after --")
  .action(async (args, options) => {
    await validateAction(options);

    await runAction(options, args);
  });

program.command("init").action(initAction);

program.parse();
