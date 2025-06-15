import { resolve } from "node:path";
import { exec } from "lib/exec";
import { lifecycle } from "lib/lifecycle";
import type {
	FatimaBuiltInLoadFunction,
	UnsafeEnvironmentVariables,
} from "lib/types";
import { getRuntime } from "lib/utils/get-runtime";

type TriggerDevClientMock = {
	envvars: {
		list: (
			projectId: string,
			environment: string,
		) => Promise<
			Array<{
				name: string;
				value: string;
			}>
		>;
	};
	configure: (config: { accessToken: string }) => void;
};

const load =
	(
		trigger: TriggerDevClientMock,
		config?: {
			projectId: string;
			accessToken: string;
			environment?: string;
		},
	): FatimaBuiltInLoadFunction =>
	async () => {
		const auth = {
			projectId: process.env.TRIGGER_PROJECT_ID,
			accessToken: process.env.TRIGGER_ACCESS_TOKEN,
			environment: "dev",
			...config,
		};

		if (!auth.projectId) {
			return lifecycle.error.missingConfig("TRIGGER_PROJECT_ID");
		}

		if (!auth.accessToken) {
			return lifecycle.error.missingConfig("TRIGGER_ACCESS_TOKEN");
		}

		trigger.configure({
			accessToken: auth.accessToken,
		});

		const secrets = await trigger.envvars.list(
			auth.projectId,
			auth.environment,
		);

		return secrets.reduce((acc, { name, value }) => {
			acc[name] = value;
			return acc;
		}, {} as UnsafeEnvironmentVariables);
	};

type TriggerDevPluginMock = {
	name: string;
	setup: (build: { onStart: (callback: () => void) => void }) => void;
};

type TriggerDevBuildContextMock = {
	registerPlugin: (plugin: TriggerDevPluginMock) => void;
	target: string;
};

type TriggerDevExtensionMock = {
	name: string;
	onBuildStart: (context: TriggerDevBuildContextMock) => void;
};

export const extension = (configPath?: string): TriggerDevExtensionMock => ({
	name: "fatima-trigger-dev",
	onBuildStart(context) {
		if (context.target === "dev") return;

		context.registerPlugin({
			name: "fatima-trigger-dev",
			async setup(build) {
				build.onStart(async () => {
					const runtime = getRuntime();

					const cmdPath = resolve(
						process.cwd(),
						"node_modules/fatima/dist/cli/cli.cjs",
					);

					await new Promise<void>((resolve, reject) => {
						const cmd = [runtime, cmdPath, "generate"];

						if (configPath) {
							cmd.push(`--config=${configPath}`);
						}

						const child = exec(cmd, {
							shell: true,
						});

						child.on("error", (error) => {
							console.error(`[Fatima] Error: ${error.message}`);
							reject(error);
						});

						child.on("close", (code) => {
							if (code !== 0) {
								console.error(`Command exited with code ${code}`);
								reject(new Error(`Command exited with code ${code}`));
							} else {
								resolve();
							}
						});
					});
				});
			},
		});
	},
});

export const triggerDev = {
	load,
	extension,
};
