import { theme } from "../../theme";
import { Box } from "../../ui/box";
import { Text } from "../../ui/text";

export function EnvironmentTabs({
	environments,
	selectedEnvironment,
	counts = {},
	totalSecrets = 0,
	onSelect,
	focused = true,
}: {
	environments: string[];
	selectedEnvironment: string;
	counts?: Record<string, number>;
	totalSecrets?: number;
	onSelect?: (environment: string, index: number) => void;
	focused?: boolean;
}) {
	return (
		<Box flexDirection="column" width="100%" height="100%">
			<Box justifyContent="space-between" width="100%" marginBottom={1}>
				<Text bold color={focused ? theme.fg : theme.muted}>
					environments
				</Text>
				<Text color={theme.muted}>{totalSecrets}</Text>
			</Box>
			{environments.map((environment) => {
				const index = environments.indexOf(environment);
				const active = environment === selectedEnvironment;
				return (
					<Box
						key={environment}
						width="100%"
						justifyContent="space-between"
						paddingX={1}
						marginBottom={0}
						onMouseUp={() => onSelect?.(environment, index)}
					>
						<Text
							color={focused && active ? theme.fg : theme.muted}
							bold={focused && active}
							truncate
						>
							{active ? "› " : "  "}
							{environment}
						</Text>
						<Text color={focused && active ? theme.fg : theme.muted}>
							{counts[environment] ?? 0}
						</Text>
					</Box>
				);
			})}
		</Box>
	);
}
