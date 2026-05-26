import React from "react";
import type { PrimitiveProps } from "./primitive-types";

export function TextInput(props: PrimitiveProps): React.ReactElement {
	return React.createElement("input", props);
}
