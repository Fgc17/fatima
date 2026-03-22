import { Command, Flags, type Interfaces } from "@oclif/core";
import type { FatimaConfig } from "./core/config";
import { loadConfig } from "./lib/config/read-config";

export type BaseFlags<T extends typeof Command> = Interfaces.InferredFlags<
	typeof BaseCommand.baseFlags & T["flags"]
>;

export abstract class BaseCommand<T extends typeof Command> extends Command {
	static baseFlags = {
		config: Flags.string({
			description: "Path to env.config.ts",
			helpGroup: "GLOBAL",
		}),
		environment: Flags.string({
			description: "Override the resolved environment name",
			helpGroup: "GLOBAL",
		}),
		debug: Flags.boolean({
			description: "Show stack traces and nested causes",
			helpGroup: "GLOBAL",
			default: false,
		}),
		"process-env": Flags.boolean({
			description: "Skip providers and only use process.env",
			helpGroup: "GLOBAL",
			default: false,
		}),
		strict: Flags.boolean({
			description: "Validate before generating files",
			helpGroup: "GLOBAL",
			default: false,
		}),
	};

	protected flags!: BaseFlags<T>;
	protected cfg!: FatimaConfig;

	public async init(): Promise<void> {
		await super.init();

		const { flags } = await this.parse({
			flags: this.ctor.flags,
			baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
			args: this.ctor.args,
			strict: this.ctor.strict,
		});

		this.flags = flags as BaseFlags<T>;
		this.cfg = await loadConfig(this.flags.config);
	}
}
