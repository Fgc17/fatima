import { type CliRenderer, createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import React from "react";

type RuntimeContextValue = {
	exit: () => void;
	renderer: CliRenderer;
};

const RuntimeContext = React.createContext<RuntimeContextValue | null>(null);

export function useOpenTuiRuntime(): RuntimeContextValue {
	const value = React.useContext(RuntimeContext);
	if (!value) {
		throw new Error("Fatima OpenTUI runtime was not initialized.");
	}
	return value;
}

export async function renderOpenTuiApp(
	node: React.ReactElement,
): Promise<void> {
	let resolveExit: () => void = () => {};
	const done = new Promise<void>((resolve) => {
		resolveExit = resolve;
	});

	const renderer = await createCliRenderer({
		screenMode: "alternate-screen",
		targetFps: 60,
		gatherStats: false,
		exitOnCtrlC: false,
		clearOnShutdown: true,
		useMouse: true,
		useKittyKeyboard: {},
		autoFocus: false,
		openConsoleOnError: false,
		backgroundColor: "#0a0a0a",
	});

	const exit = () => resolveExit();
	const root = createRoot(renderer);

	root.render(
		<RuntimeContext.Provider value={{ exit, renderer }}>
			{node}
		</RuntimeContext.Provider>,
	);

	try {
		await done;
	} finally {
		renderer.destroy();
	}
}
