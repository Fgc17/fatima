import { theme } from "../theme";
import { Box } from "./box";
import { Text } from "./text";

export function FieldLabel({
	children,
	active = true,
}: {
	children: string;
	active?: boolean;
}) {
	return (
		<Box marginBottom={1}>
			<Text color={active ? theme.fg : theme.muted} bold={active}>
				{children}
			</Text>
		</Box>
	);
}
