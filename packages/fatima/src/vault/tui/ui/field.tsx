import { useKeyboard } from "@opentui/react";
import React from "react";
import { useWindowSize } from "../hooks/use-window-size";
import { theme } from "../theme";
import { Box } from "./box";
import { FieldLabel } from "./field-label";
import { InputSurface } from "./input-surface";
import { Text } from "./text";

function formatFieldValue({
	value,
	mask,
	placeholder,
	width,
}: {
	value: string;
	mask?: string;
	placeholder?: string;
	width?: number;
}) {
	const formatted =
		value.length > 0
			? mask
				? mask.repeat(value.length)
				: value
			: (placeholder ?? "");

	if (!width || formatted.length <= width) {
		return formatted;
	}

	return formatted.slice(Math.max(0, formatted.length - width));
}

function ActiveFieldInput({
	value,
	onChange,
	onSubmit,
	mask,
	placeholder,
	width,
}: {
	value: string;
	onChange: (value: string) => void;
	onSubmit?: (value: string) => void;
	mask?: string;
	placeholder?: string;
	width: number;
}) {
	const [cursor, setCursor] = React.useState(value.length);

	React.useEffect(() => {
		setCursor((current) => Math.max(0, Math.min(current, value.length)));
	}, [value]);

	const maskedValue = mask ? mask.repeat(value.length) : value;
	const safeWidth = Math.max(1, width);
	const start = Math.max(0, Math.min(cursor - safeWidth + 1, value.length));
	const visibleValue = maskedValue.slice(start, start + safeWidth);

	useKeyboard((event) => {
		const input = event.raw || event.sequence;

		if (event.name === "left" || input === "\x1b[D") {
			setCursor((current) => Math.max(0, current - 1));
			return;
		}

		if (event.name === "right" || input === "\x1b[C") {
			setCursor((current) => Math.min(value.length, current + 1));
			return;
		}

		if (
			input === "\x01" ||
			input === "\x1b[H" ||
			input === "\x1bOH" ||
			input === "\x1b[1~" ||
			input === "\x1b[7~"
		) {
			setCursor(0);
			return;
		}

		if (
			input === "\x05" ||
			input === "\x1b[F" ||
			input === "\x1bOF" ||
			input === "\x1b[4~" ||
			input === "\x1b[8~"
		) {
			setCursor(value.length);
			return;
		}

		if (event.name === "backspace" || input === "\b" || input === "\x7f") {
			if (cursor === 0) return;
			onChange(value.slice(0, cursor - 1) + value.slice(cursor));
			setCursor((current) => Math.max(0, current - 1));
			return;
		}

		if (input === "\x04" || input === "\x1b[3~" || event.name === "delete") {
			onChange("");
			setCursor(0);
			return;
		}

		if (input === "\r" || event.name === "return" || event.name === "enter") {
			onSubmit?.(value);
			return;
		}

		if (input.startsWith("\x1b") || input < " ") {
			return;
		}

		const nextValue = value.slice(0, cursor) + input + value.slice(cursor);
		onChange(nextValue);
		setCursor((current) => current + input.length);
	});

	if (value.length === 0 && placeholder) {
		const placeholderText = placeholder.slice(0, safeWidth);
		return <Text color={theme.muted}>{placeholderText}</Text>;
	}

	return <Text color={theme.fg}>{visibleValue}</Text>;
}

export function Field({
	label,
	value,
	onChange,
	onSubmit,
	active = true,
	mask,
	placeholder,
	help,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	onSubmit?: (value: string) => void;
	active?: boolean;
	mask?: string;
	placeholder?: string;
	help?: string;
}) {
	const { columns } = useWindowSize();
	const displayWidth = Math.max(
		12,
		Math.min(60, Math.floor(columns * 0.4) - 10),
	);

	return (
		<Box flexDirection="column" marginBottom={1} width="100%">
			<FieldLabel active={active}>{label}</FieldLabel>
			<InputSurface active={active} width="100%">
				<Box height={1} flexGrow={1} width="100%" overflow="hidden">
					{active ? (
						<ActiveFieldInput
							value={value}
							onChange={onChange}
							onSubmit={onSubmit}
							mask={mask}
							placeholder={placeholder}
							width={displayWidth}
						/>
					) : (
						<Text color={value.length > 0 ? theme.fg : theme.muted}>
							{formatFieldValue({
								value,
								mask,
								placeholder,
								width: displayWidth,
							})}
						</Text>
					)}
				</Box>
			</InputSurface>
			{help ? <Text color={theme.muted}>{help}</Text> : null}
		</Box>
	);
}
