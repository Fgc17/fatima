import process from "node:process";
import readline from "node:readline";
import { createInjectableEnv } from "lib/env/patch-env";
import { exec } from "lib/exec";
import { createHeaven } from "lib/heaven/create-heaven";
import { logger } from "lib/logger";
import { fatimaStore } from "lib/store";
import { action } from "../context/action";
import { type EnvActionContext, envActionContext } from "../context/env";
import { generateService } from "./generate";
import { reloadService } from "./reload";

const environmentBlacklist = [
	"production",
	"prod",
	"staging",
	"stg",
	"preview",
	"pre",
	"prev",
	"preprod",
];

export const devService = async (ctx: EnvActionContext) => {
	const { config, env, envCount, args } = ctx;

	fatimaStore.set("devMode", true);

	const environment = fatimaStore.get("environment") as string;
	if (environmentBlacklist.includes(environment)) {
		throw new Error(
			`Your 'config.environment()' returned '${environment}', you can't run 'fatima dev' here.`,
		);
	}

	if (
		!fatimaStore.get("liteMode") &&
		fatimaStore.get("strictMode") &&
		config.schema
	) {
		await generateService(ctx);
	}

	logger.success(`Loaded ${envCount} environment variables`);

	const injectableEnv = createInjectableEnv(env);
	const child = exec(args, { env: injectableEnv, shell: false });
	const { closeHeaven } = createHeaven(config);

	const killChildTree = () => {
		if (!child.pid) return;
		try {
			process.kill(-child.pid, "SIGTERM");
		} catch {
			try {
				child.kill("SIGTERM");
			} catch {}
		}
	};

	const restoreTTY = () => {
		if (process.stdin.isTTY) {
			try {
				process.stdin.setRawMode(false);
				process.stdin.pause();
			} catch {}
		}
		process.stdout.write("\n");
	};

	let cleanup = () => {
		restoreTTY();
		closeHeaven();
		killChildTree();
	};

	const gracefulExit = (code = 0) => {
		cleanup();
		process.exit(code);
	};

	if (process.stdin.isTTY) {
		readline.emitKeypressEvents(process.stdin);
		process.stdin.setRawMode(true);
		process.stdin.resume();

		logger.info("Press 'r' to reload environment, Ctrl+C to exit.");

		const handleKeypress = async (_: string, key: readline.Key) => {
			try {
				if (key.sequence === "\u0003") {
					return gracefulExit(0);
				}
				if (key.name?.toLowerCase() === "r") {
					logger.info("Reloading environment variables...");
					await reloadService({ config, options: {}, args: [] });
					logger.success("Environment reloaded successfully.");
				}
			} catch (err) {
				logger.error(
					`Failed to reload: ${
						err instanceof Error ? err.message : "Unknown error"
					}`,
				);
			}
		};

		process.stdin.on("keypress", handleKeypress);

		const detachKeypress = () => {
			process.stdin.off("keypress", handleKeypress);
		};
		const oldCleanup = cleanup;

		cleanup = () => {
			detachKeypress();
			oldCleanup();
		};
	}

	child.on("error", () => gracefulExit(1));
	child.on("close", (code) => gracefulExit(code ?? 0));

	process.once("SIGINT", () => gracefulExit(0));
	process.once("SIGTERM", () => gracefulExit(0));
	process.once("exit", cleanup);
};

export const devAction = action(devService, envActionContext);
