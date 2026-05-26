import { useOpenTuiRuntime } from "../platform/opentui-runtime";

export function useApp() {
	const { exit } = useOpenTuiRuntime();
	return { exit };
}
