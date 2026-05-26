import type React from "react";
import { theme } from "../theme";
import { Box } from "./box";

export type SurfaceTone = "panel" | "modal" | "input" | "inputInactive";

const surfaceBackground: Record<SurfaceTone, string> = {
	panel: theme.surface,
	modal: theme.modalSurface,
	input: theme.inputSurface,
	inputInactive: theme.inputSurfaceInactive,
};

export function Surface({
	children,
	tone = "panel",
	bordered = false,
	...props
}: Record<string, any> & {
	children?: React.ReactNode;
	tone?: SurfaceTone;
	bordered?: boolean;
}) {
	return (
		<Box
			backgroundColor={surfaceBackground[tone]}
			{...(bordered ? { border: true, borderColor: theme.border } : {})}
			{...props}
		>
			{children}
		</Box>
	);
}
