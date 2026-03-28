#!/usr/bin/env node

import { create } from "./create-fatima";
import { checkPackageJson } from "./utils/check-package-json";
import { logger } from "./utils/logger";
import { wizard } from "./wizard/wizard";

const form = async () => {
	checkPackageJson();

	const { language, adapter, validator } = await wizard();

	const result = await create({
		adapter,
		language,
		validator,
	});

	await logger.summary(language, result.dependencies);
};

const runForm = async () =>
	form().catch((e) => {
		if (!(e instanceof Error) || !e.message.includes("force closed")) {
			console.error(e);
		}

		console.log("Exiting...");
	});

runForm();
