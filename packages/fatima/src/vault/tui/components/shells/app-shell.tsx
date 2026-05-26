import { useWindowSize } from "../../hooks/use-window-size";
import { theme } from "../../theme";
import { Box } from "../../ui/box";
import { Text } from "../../ui/text";

function StatusBadge({ label }: { label: string }) {
	const color =
		label === "unlocked"
			? theme.success
			: label === "setup"
				? theme.warning
				: theme.danger;
	return (
		<Box marginLeft={1}>
			<Text color={color} bold>
				{label}
			</Text>
		</Box>
	);
}

export function AppShell({
	children,
	project,
	status = "locked",
	secretCount = 0,
	environmentCount = 0,
}: {
	children: React.ReactNode;
	project: string;
	status?: "locked" | "unlocked" | "setup";
	secretCount?: number;
	environmentCount?: number;
}) {
	const { columns, rows } = useWindowSize();
	const width = Math.max(1, columns);
	const height = Math.max(1, rows);
	const projectName = project.split(/[\\/]/).filter(Boolean).pop() ?? project;

	return (
		<Box
			width={width}
			height={height}
			backgroundColor={theme.bg}
			flexDirection="column"
			paddingX={2}
			paddingY={1}
		>
			<Box height={1} justifyContent="space-between" width="100%">
				<Box>
					<Text color={theme.primary}> ⚿{"  "}</Text>
					<Text bold color={theme.primary}>
						fatima
					</Text>
					<Text color={theme.muted}> / </Text>
					<Text color={theme.fg}>{projectName}</Text>
				</Box>
				<Box>
					<Text color={theme.muted}>local vault</Text>
					<StatusBadge label={status} />
				</Box>
			</Box>
			<Box flexDirection="column" paddingY={1} flexGrow={1} width="100%">
				{children}
			</Box>
			<Box height={1} width="100%" justifyContent="space-between">
				<Box>
					<Text color={theme.fg}>{status}</Text>
					<Text color={theme.faint}> · </Text>
					<Text color={theme.muted}>{secretCount} secrets</Text>
					<Text color={theme.faint}> · </Text>
					<Text color={theme.muted}>{environmentCount} environments</Text>
				</Box>
				<Text color={theme.muted}>/ commands</Text>
			</Box>
		</Box>
	);
}
