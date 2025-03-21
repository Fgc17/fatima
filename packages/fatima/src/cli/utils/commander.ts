import type { Command } from "commander";

export const commander =
	(program: Command, createBase: (base: Command) => Command) =>
	(cmd?: string) => {
		let base = program;

		if (cmd) {
			base = base.command(cmd);
		}

		base = createBase(base);

		return base;
	};
