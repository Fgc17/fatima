import type React from "react";
import { type Tone, theme, toneColor } from "../theme";
import { Box } from "./box";
import { Text } from "./text";

export function Panel({
	children,
	title,
	subtitle,
	tone = "muted",
	focused = false,
	borderColor = "gray",
	width,
	paddingX = 1,
	paddingY = 0,
	flexGrow,
	variant = "plain",
}: {
	children: React.ReactNode;
	title: string;
	subtitle?: string;
	tone?: Tone;
	focused?: boolean;
	borderColor?: string;
	width?: number | string;
	paddingX?: number;
	paddingY?: number;
	flexGrow?: number;
	variant?: "plain" | "surface" | "bordered";
}) {
	const bordered = variant === "bordered";
	const surface = variant === "surface" || (focused && variant === "plain");
	return (
		<Box
			border={bordered}
			borderStyle="single"
			borderColor={focused ? theme.borderActive : borderColor}
			backgroundColor={surface ? theme.surface : undefined}
			flexDirection="column"
			width={width}
			flexGrow={flexGrow}
		>
			<Box paddingX={paddingX} justifyContent="space-between" marginBottom={1}>
				<Text color={focused ? theme.primary : toneColor(tone)} bold>
					{title}
				</Text>
				{subtitle ? <Text color={theme.muted}> {subtitle}</Text> : null}
			</Box>
			<Box
				flexDirection="column"
				paddingX={paddingX}
				paddingY={paddingY}
				flexGrow={1}
			>
				{children}
			</Box>
		</Box>
	);
}
