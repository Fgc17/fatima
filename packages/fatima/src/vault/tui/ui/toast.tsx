import { theme } from "../theme";
import { Box } from "./box";
import { Text } from "./text";

const labels = {
	info: "INFO",
	success: "SUCCESS",
	warning: "WARNING",
	error: "ERROR",
} as const;

const colors = {
	info: theme.info,
	success: theme.success,
	warning: theme.warning,
	error: theme.danger,
} as const;

export function Toast({
	type,
	message,
}: {
	type: keyof typeof labels;
	message: string;
}) {
	return (
		<Box marginBottom={1} paddingX={1} border borderColor={colors[type]}>
			<Text color={colors[type]} bold>
				{labels[type].toLowerCase()}
			</Text>
			<Text color={theme.fg}> {message}</Text>
		</Box>
	);
}
