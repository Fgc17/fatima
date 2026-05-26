import type React from "react";

export type PrimitiveProps = Record<string, any> & {
	children?: React.ReactNode;
};

export function toPercent(value: unknown) {
	return value === "100%" ? "100%" : value;
}
