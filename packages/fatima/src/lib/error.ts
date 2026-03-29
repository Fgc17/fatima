export class FatimaError extends Error {
	public readonly exitCode: number;

	public constructor(
		message: string,
		options?: {
			cause?: unknown;
			exitCode?: number;
		},
	) {
		super(message, { cause: options?.cause });
		this.name = "FatimaError";
		this.exitCode = options?.exitCode ?? 1;
	}
}
