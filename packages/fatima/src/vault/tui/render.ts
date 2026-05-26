import React from "react";
import { unlockSecretManagerWithPassword } from "../api";
import { FatimaApp } from "./app";
import { renderOpenTuiApp } from "./platform/opentui-runtime";

export async function runTui(
	config?: string,
	password?: string,
): Promise<void> {
	const initialSession = password
		? unlockSecretManagerWithPassword(password, config)
		: null;
	await renderOpenTuiApp(
		React.createElement(FatimaApp, {
			config,
			initialPassword: password,
			initialSession,
		}),
	);
}
