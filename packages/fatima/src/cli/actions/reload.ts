import { logger } from "lib/logger";
import { type ActionContext, action } from "../context/action";

export const reloadService = async ({ config }: ActionContext) => {
	const port = config.heaven;

	if (!port) {
		throw new Error(
			"Failed to reload environment variables, missing port, please set 'ports.reload' in your fatima config.",
		);
	}

	await fetch(`http://localhost:${port}/fatima`, {
		method: "POST",
	}).then((res) => {
		if (res.status !== 200) {
			throw new Error(
				`Failed to reload environment variables, did you run 'fatima dev'?`,
			);
		}

		logger.success("Successfully reloaded environment variables");
	});
};

export const reloadAction = action(reloadService);
