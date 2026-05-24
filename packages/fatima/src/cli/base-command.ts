import { Command, Flags, type Interfaces } from "@oclif/core";

export type BaseFlags<T extends typeof Command> = Interfaces.InferredFlags<
	typeof BaseCommand.baseFlags & T["flags"]
>;

export abstract class BaseCommand<T extends typeof Command> extends Command {
	static baseFlags = {
		config: Flags.string({
			description: "Path to fatima.json",
			helpGroup: "GLOBAL",
		}),
		environment: Flags.string({
			description: "Override the resolved environment name",
			helpGroup: "GLOBAL",
			char: "e",
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
	protected parsedArgv: string[] = [];

	public async init(): Promise<void> {
		await super.init();

		const { argv, flags } = await this.parse({
			flags: this.ctor.flags,
			baseFlags: (super.ctor as unknown as typeof BaseCommand).baseFlags,
			args: this.ctor.args,
			strict: this.ctor.strict,
		});

		this.parsedArgv = argv as string[];
		this.flags = flags as BaseFlags<T>;
	}
}
