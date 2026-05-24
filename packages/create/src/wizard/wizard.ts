import type { Adapter, Generator, Validator } from "../lib/types";
import { askAdapter } from "./prompts/adapter";
import { askLanguage } from "./prompts/lang";
import { askUserIntent } from "./prompts/monorepo";
import { askValidator } from "./prompts/validator";

export interface WizardResult {
	generator: Generator;
	adapter: Adapter;
	validator: Validator;
}

export async function wizard(): Promise<WizardResult> {
	const userIntent = await askUserIntent();

	if (userIntent === "quit") {
		throw new Error("Exiting...");
	}

	const generator = (await askLanguage()) as Generator;
	const adapter = (await askAdapter()) as Adapter;
	const validator = (await askValidator(
		generator === "python" ? "javascript" : generator,
	)) as Validator;

	return { generator, adapter, validator };
}
