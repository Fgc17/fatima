type DebugMeta = Record<string, unknown>;

export type FatimaDebugLogger = {
	enabled: boolean;
	debug: (step: string, message: string, meta?: DebugMeta) => void;
};

function formatMeta(meta?: DebugMeta): string {
	if (!meta || Object.keys(meta).length === 0) {
		return "";
	}

	return ` ${JSON.stringify(meta)}`;
}

export function createDebugLogger(enabled = false): FatimaDebugLogger {
	return {
		enabled,
		debug(step, message, meta) {
			if (!enabled) {
				return;
			}

			process.stderr.write(`[fatima:${step}] ${message}${formatMeta(meta)}\n`);
		},
	};
}
