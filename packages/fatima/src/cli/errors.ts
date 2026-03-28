import { FatimaError } from "../lib/error";

type ErrorLike = Error & {
	exitCode?: number;
	code?: string;
	cause?: unknown;
	stack?: string;
	name?: string;
};

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	return "Unexpected Fatima error.";
}

function collectDetails(error: unknown, debug: boolean): string[] {
	if (!debug || !(error instanceof Error)) {
		return [];
	}

	const details: string[] = [];
	let current: unknown = error;
	let depth = 0;

	while (current instanceof Error) {
		if (depth > 0) {
			details.push(`Cause ${depth}: ${current.message}`);
		}

		if (current.stack) {
			details.push(current.stack);
		}

		current = current.cause;
		depth += 1;
	}

	if (current) {
		details.push(`Cause ${depth}: ${String(current)}`);
	}

	return details;
}

export function formatError(
	error: unknown,
	options: { debug: boolean },
): { details: string[]; exitCode: number; message: string } {
	const err = error as ErrorLike;
	const message = getErrorMessage(error);
	const exitCode =
		error instanceof FatimaError
			? error.exitCode
			: typeof err?.exitCode === "number"
				? err.exitCode
				: 1;

	return {
		message,
		details: collectDetails(error, options.debug),
		exitCode,
	};
}

export function hasDebugFlag(argv: string[]): boolean {
	return argv.includes("--debug");
}

export function isSilentExitError(error: unknown): boolean {
	const err = error as ErrorLike;
	return err?.code === "ERR_USE_AFTER_CLOSE" || err?.name === "ExitPromptError";
}
