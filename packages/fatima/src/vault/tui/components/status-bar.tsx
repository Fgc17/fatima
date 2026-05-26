import { environmentTone } from "../theme";
import { Box } from "../ui/box";
import { Pill } from "../ui/pill";
import { Text } from "../ui/text";

export function StatusBar({
	environment,
	mode,
	storePath,
	secretCount,
}: {
	environment: string;
	mode: string;
	storePath: string;
	secretCount: number;
}) {
	return (
		<Box justifyContent="space-between" marginBottom={1}>
			<Box gap={1}>
				<Pill label={environment} tone={environmentTone(environment)} />
				<Pill label={`${secretCount} secrets`} tone="success" active={false} />
			</Box>
			<Box gap={1}>
				<Pill label={mode} tone="brand" active={false} />
				<Text color="gray">{storePath}</Text>
			</Box>
		</Box>
	);
}
