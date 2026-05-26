import { Box } from "../ui/box";
import { KeyHint } from "../ui/key-hint";

export function CommandBar() {
	return (
		<Box width="100%" height={1} marginTop={1} overflow="hidden">
			<KeyHint keyName="/" label="commands" />
			<KeyHint keyName="a" label="add" />
			<KeyHint keyName="e" label="edit" />
			<KeyHint keyName="d" label="delete" />
			<KeyHint keyName="r" label="reveal" />
			<KeyHint keyName="v" label="view" />
			<KeyHint keyName="q" label="quit" />
		</Box>
	);
}
