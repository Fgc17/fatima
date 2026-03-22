import chalk from "chalk";
import logSymbols from "log-symbols";

export { chalk };

export const logger = {
	success(message: string): void {
		process.stdout.write(`${logSymbols.success} ${message}\n`);
	},

	info(message: string): void {
		process.stdout.write(`${logSymbols.info} ${message}\n`);
	},

	warning(message: string): void {
		process.stdout.write(`${logSymbols.warning} ${message}\n`);
	},

	error(message: string): void {
		process.stderr.write(`${logSymbols.error} ${chalk.red(message)}\n`);
	},

	dim(message: string): void {
		process.stdout.write(`${chalk.dim(message)}\n`);
	},

	line(message: string): void {
		process.stdout.write(`${message}\n`);
	},
};
