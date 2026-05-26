import type { Adapter, Generator, ModelPreset } from "../types";
import { askAdapter } from "./prompts/adapter";
import { askLanguage } from "./prompts/lang";
import { askModelPreset } from "./prompts/model";
import { askUserIntent } from "./prompts/workspace";

export interface WizardResult {
	generator: Generator;
	adapter: Adapter;
	modelPreset: ModelPreset;
}

export async function wizard(): Promise<WizardResult> {
	const userIntent = await askUserIntent();

	if (userIntent === "quit") {
		throw new Error("Exiting...");
	}

	const generator = (await askLanguage()) as Generator;
	const adapter = (await askAdapter()) as Adapter;
	const modelPreset = (await askModelPreset()) as ModelPreset;

	return { generator, adapter, modelPreset };
}
