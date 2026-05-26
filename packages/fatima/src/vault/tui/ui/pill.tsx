import { type Tone, toneColor } from "../theme";
import { Text } from "./text";

export function Pill({
	label,
	tone = "brand",
	active = true,
}: {
	label: string | number;
	tone?: Tone;
	active?: boolean;
}) {
	return active ? (
		<Text color={toneColor(tone)} bold>
			{label}
		</Text>
	) : (
		<Text color={toneColor(tone)}>{label}</Text>
	);
}
