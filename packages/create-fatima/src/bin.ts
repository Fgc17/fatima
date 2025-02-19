#!/usr/bin/env node

import { askValidator } from "./prompts/validator";
import { askLanguage } from "./prompts/lang";
import { askAdapter } from "./prompts/adapter";
import { askMonorepo } from "./prompts/monorepo";
import { createConfigFile } from "src/lib/create-config-file";
import type { Adapter, Language, Validator } from "src/lib/types";
import { applyUserConfigTweaks } from "./lib/tweaks";
import { logger } from "./utils/logger";
import { checkPackageJson } from "./utils/check-package-json";

const form = async () => {
	checkPackageJson();

	await askMonorepo();

	const language = (await askLanguage()) as Language;

	const adapter = (await askAdapter()) as Adapter;

	const validator = (await askValidator(language)) as Validator;

	const modules = await createConfigFile({
		adapter,
		language,
		validator,
	});

	applyUserConfigTweaks(language);

	await logger.summary(language, modules);
};

const runForm = async () => {
	try {
		await form();
	} catch (e) {
		if (!e.message.includes("force closed")) {
			console.error(e);
		}

		console.log("Exiting...");
	}
};

runForm();
