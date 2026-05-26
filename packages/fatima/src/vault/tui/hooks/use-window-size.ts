import { useTerminalDimensions } from "@opentui/react";

export function useWindowSize() {
	const { width, height } = useTerminalDimensions();
	return {
		columns: width ?? process.stdout.columns ?? 80,
		rows: height ?? process.stdout.rows ?? 24,
	};
}
