import React from "react";
import { type PrimitiveProps, toPercent } from "./primitive-types";

export function Box({
	children,
	...props
}: PrimitiveProps): React.ReactElement {
	const nextProps: PrimitiveProps = { ...props };
	nextProps.flexDirection = nextProps.flexDirection ?? "row";
	if (nextProps.borderStyle || nextProps.borderColor) {
		nextProps.border = nextProps.border ?? true;
	}
	if (nextProps.borderStyle === "round") {
		nextProps.borderStyle = "rounded";
	}
	nextProps.width = toPercent(nextProps.width);
	nextProps.height = toPercent(nextProps.height);
	return React.createElement("box", nextProps, children);
}
