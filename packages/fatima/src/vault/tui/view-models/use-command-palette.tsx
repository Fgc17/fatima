import { useGlobalStore } from "../store/global-store";

export function useCommandPalette() {
	const { commandItems, commandCursor, actions } = useGlobalStore();
	return {
		commandItems,
		commandCursor,
		runCommand: actions.runCommand,
	};
}
