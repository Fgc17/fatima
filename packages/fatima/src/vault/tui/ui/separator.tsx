import { useWindowSize } from "../hooks/use-window-size";
import { theme } from "../theme";
import { Text } from "./text";

export function Separator({ width }: { width?: number }) {
	const size = useWindowSize();
	const resolvedWidth = width ?? size.columns;

	return (
		<Text color={theme.borderMuted}>
			{"─".repeat(Math.max(1, resolvedWidth - 4))}
		</Text>
	);
}
