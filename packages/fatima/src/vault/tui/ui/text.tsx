import { TextAttributes } from "@opentui/core";
import React from "react";
import type { PrimitiveProps } from "./primitive-types";

export function Text({
	children,
	color,
	backgroundColor,
	bold,
	inverse,
	dimColor,
	...props
}: PrimitiveProps): React.ReactElement {
	let attributes = props.attributes ?? TextAttributes.NONE;
	if (bold) attributes |= TextAttributes.BOLD;
	if (inverse) attributes |= TextAttributes.INVERSE;
	if (dimColor) attributes |= TextAttributes.DIM;
	const content =
		typeof children === "string" || typeof children === "number"
			? String(children)
			: undefined;
	return React.createElement(
		"text",
		{
			...props,
			fg: props.fg ?? color,
			bg: props.bg ?? backgroundColor,
			attributes,
			content: props.content ?? content,
		},
		content ? undefined : children,
	);
}
