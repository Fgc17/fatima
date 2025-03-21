import type { Adapter, Language, Validator } from "@/lib/types";
import { askUserIntent } from "./prompts/monorepo";
import { askAdapter } from "./prompts/adapter";
import { askLanguage } from "./prompts/lang";
import { askValidator } from "./prompts/validator";

export interface WizardResult {
	language: Language;
	adapter: Adapter;
	validator: Validator;
}

export async function wizard(): Promise<WizardResult> {
	const userIntent = await askUserIntent();

	if (userIntent === "quit") {
		throw "Exiting...";
	}

	const language = (await askLanguage()) as Language;

	const adapter = (await askAdapter()) as Adapter;

	const validator = (await askValidator(language)) as Validator;

	return { language, adapter, validator };
}
