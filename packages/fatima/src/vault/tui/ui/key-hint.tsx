import { theme } from "../theme";
import { Box } from "./box";
import { Text } from "./text";

export function KeyHint({
	keyName,
	label,
}: {
	keyName: string;
	label: string;
}) {
	return (
		<Box marginRight={1}>
			<Text color={theme.primary} bold>
				{keyName}
			</Text>
			<Text color={theme.muted}> {label}</Text>
		</Box>
	);
}
