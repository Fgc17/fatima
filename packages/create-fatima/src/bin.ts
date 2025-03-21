#!/usr/bin/env node

import { createConfigFile } from "src/lib/create-config-file";
import { applyUserConfigTweaks } from "./lib/tweaks";
import { logger } from "./utils/logger";
import { checkPackageJson } from "./utils/check-package-json";
import { wizard } from "./wizard/wizard";

const form = async () => {
	checkPackageJson();

	const { language, adapter, validator } = await wizard();

	const modules = await createConfigFile({
		adapter,
		language,
		validator,
	});

	applyUserConfigTweaks(language);

	await logger.summary(language, modules);
};

const runForm = async () =>
	form().catch((e) => {
		if (!e.message.includes("force closed")) {
			console.error(e);
		}

		console.log("Exiting...");
	});

runForm();
