import { Box } from "../ui/box";
import { KeyHint } from "../ui/key-hint";

export function FormGuides() {
	return (
		<Box marginTop={1} justifyContent="space-between" width="100%">
			<Box>
				<KeyHint keyName="ctrl+a" label="line start" />
				<KeyHint keyName="ctrl+e" label="line end" />
				<KeyHint keyName="ctrl+d" label="clear field" />
			</Box>
		</Box>
	);
}

export function FormFooter({
	primary,
	allowQuit = false,
}: {
	primary: string;
	allowQuit?: boolean;
}) {
	return (
		<Box justifyContent="space-between" width="100%">
			<Box>
				<KeyHint keyName="enter" label={primary} />
			</Box>
			<Box>
				<KeyHint keyName="esc" label={allowQuit ? "quit" : "cancel"} />
			</Box>
		</Box>
	);
}
