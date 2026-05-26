import React from "react";
import type { PrimitiveProps } from "./primitive-types";

export function ScrollBox({
	children,
	...props
}: PrimitiveProps): React.ReactElement {
	return React.createElement("scrollbox", props, children);
}
