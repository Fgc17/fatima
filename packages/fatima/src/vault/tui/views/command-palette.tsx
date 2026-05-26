import type React from "react";
import { theme } from "../theme";
import { useCommandPalette } from "../view-models/use-command-palette";
import { Box } from "../ui/box";
import { Modal } from "../ui/modal";
import { Text } from "../ui/text";

export function CommandPaletteView({
	footer,
}: {
	footer: React.ReactNode;
}) {
	const { commandItems, commandCursor, runCommand } = useCommandPalette();
	return (
		<Modal title="Command palette" footer={footer}>
			<Box flexDirection="column" width="100%">
				<Text color={theme.muted}>Type a shortcut, or use ↑/↓ and enter.</Text>
				<Box flexDirection="column" marginTop={1}>
					{commandItems.map((command, index) => {
						const active = index === commandCursor;
						return (
							<Box key={command.title} width="100%" paddingX={1} justifyContent="space-between" onMouseUp={() => runCommand(index)}>
								<Box>
									<Text color={active ? theme.fg : theme.muted} bold>
										{active ? "›" : " "} {command.key}
									</Text>
									<Text color={active ? theme.fg : theme.muted} bold={active}>
										 {command.title}
									</Text>
								</Box>
								<Text color={theme.muted}>{command.description}</Text>
							</Box>
						);
					})}
				</Box>
			</Box>
		</Modal>
	);
}
