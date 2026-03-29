import chalk from "chalk";
import logSymbols from "log-symbols";

export type FatimaLog = {
	enabled: boolean;
	info: (message: string) => void;
	dim: (message: string) => void;
	success: (message: string) => void;
};

export function createLog(enabled = false): FatimaLog {
	return {
		enabled,
		info(message) {
			if (!enabled) {
				return;
			}

			process.stdout.write(`${logSymbols.info} ${message}\n`);
		},
		dim(message) {
			if (!enabled) {
				return;
			}

			process.stdout.write(`${chalk.dim(message)}\n`);
		},
		success(message) {
			if (!enabled) {
				return;
			}

			process.stdout.write(`${logSymbols.success} ${message}\n`);
		},
	};
}
