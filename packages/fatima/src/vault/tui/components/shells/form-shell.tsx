import type React from "react";
import { useWindowSize } from "../../hooks/use-window-size";
import { Box } from "../../ui/box";

export function FormShell({
	children,
	guides,
}: {
	children: React.ReactNode;
	guides: React.ReactNode;
}) {
	const { columns, rows } = useWindowSize();

	return (
		<Box
			position="absolute"
			left={0}
			top={0}
			width={columns}
			height={rows}
			zIndex={900}
			flexDirection="column"
		>
			<Box flexGrow={1} justifyContent="center" alignItems="center" flexDirection="column">
				{children}
			</Box>
			{guides}
		</Box>
	);
}
