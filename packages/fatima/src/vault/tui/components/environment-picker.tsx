import { theme } from "../theme";
import { Box } from "../ui/box";
import { Text } from "../ui/text";

export function EnvironmentPicker({
	environments,
	selectedEnvironments,
	cursor,
	active,
	error,
	submitLabel,
}: {
	environments: string[];
	selectedEnvironments: string[];
	cursor: number;
	active: boolean;
	error?: string | null;
	submitLabel: string;
}) {
	return (
		<Box flexDirection="column" marginTop={1}>
			<Text color={active ? theme.fg : theme.muted} bold>
				ENVIRONMENTS
			</Text>
			{environments.map((environment, index) => {
				const focused = active && index === cursor;
				const checked = selectedEnvironments.includes(environment);
				return (
					<Text
						key={environment}
						color={focused ? theme.fg : theme.muted}
						bold={focused}
					>
						{focused ? "> " : "  "}[{checked ? "x" : " "}] {environment}
					</Text>
				);
			})}
			<Text color={theme.muted}>↑/↓ move · space toggle · enter {submitLabel}</Text>
			{error ? <Text color={theme.fg}>{error}</Text> : null}
		</Box>
	);
}
