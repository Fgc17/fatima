import { Command, Flags, type Interfaces } from "@oclif/core";
import { providers } from "../providers";

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
			char: "e",
		}),
		provider: Flags.string({
			description: "Override provider for the command",
			helpGroup: "GLOBAL",
			options: Object.keys(providers),
			char: "p",
		}),
		"public-prefix": Flags.string({
			description: "Override public prefix for the command",
			helpGroup: "GLOBAL",
			char: "P",
		}),
		debug: Flags.boolean({
			description: "Show internal debug logs, stack traces, and nested causes",
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

	public async init(): Promise<void> {
		await super.init();

		const { flags } = await this.parse({
			flags: this.ctor.flags,
			baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
			args: this.ctor.args,
			strict: this.ctor.strict,
		});

		this.flags = flags as BaseFlags<T>;
	}
}
