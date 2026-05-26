import { theme } from "../theme";
import { Box } from "./box";
import { Text } from "./text";

export function EmptyState({ title, hint }: { title: string; hint: string }) {
	return (
		<Box flexDirection="column" paddingY={1}>
			<Text bold color={theme.fg}>
				{title}
			</Text>
			<Text color={theme.muted}>{hint}</Text>
		</Box>
	);
}
