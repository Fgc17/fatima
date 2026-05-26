import type React from "react";
import { Surface } from "./surface";

export function InputSurface({
	children,
	...props
}: Record<string, any> & { children?: React.ReactNode; active?: boolean }) {
	return (
		<Surface
			tone="input"
			height={1}
			paddingX={1}
			alignItems="center"
			{...props}
		>
			{children}
		</Surface>
	);
}
