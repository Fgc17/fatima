import type React from "react";
import { useWindowSize } from "../hooks/use-window-size";
import type { Tone } from "../theme";
import { theme } from "../theme";
import { Box } from "./box";
import { Surface } from "./surface";
import { Text } from "./text";

export function Modal({
	title,
	tone = "brand",
	children,
	footer,
}: {
	title: string;
	tone?: Tone;
	children: React.ReactNode;
	footer?: React.ReactNode;
}) {
	void tone;
	const { columns, rows } = useWindowSize();
	const width = Math.max(48, Math.min(68, Math.floor(columns * 0.55)));
	const top = Math.max(2, Math.floor(rows * 0.18));

	return (
		<Box
			position="absolute"
			left={0}
			top={0}
			width={columns}
			height={rows}
			zIndex={1000}
			alignItems="center"
			paddingTop={top}
			flexDirection="column"
		>
			<Surface
				tone="modal"
				flexDirection="column"
				width={width}
				paddingX={3}
				paddingY={1}
			>
				<Box justifyContent="space-between" marginBottom={1}>
					<Text color={theme.primary} bold>
						{title}
					</Text>
					<Text color={theme.faint}>esc close</Text>
				</Box>
				<Box flexDirection="column" paddingTop={0} paddingBottom={1}>
					{children}
				</Box>
				{footer ? (
					<Box paddingBottom={0} justifyContent="space-between">
						{typeof footer === "string" ? (
							<Text color={theme.muted}>{footer}</Text>
						) : (
							footer
						)}
					</Box>
				) : null}
			</Surface>
		</Box>
	);
}
