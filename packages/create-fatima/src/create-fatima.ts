import { createScaffoldPlan } from "./lib/presets";
import { writeConfigFile } from "./lib/render-config-file";
import { applyUserConfigTweaks } from "./lib/tweaks";
import type { Adapter, Language, Validator } from "./lib/types";

export async function create({
	language,
	adapter,
	validator,
}: {
	language: Language;
	adapter: Adapter;
	validator: Validator;
}) {
	const plan = createScaffoldPlan({ language, adapter, validator });

	await writeConfigFile(plan);
	applyUserConfigTweaks(language);

	return {
		dependencies: plan.dependencies,
		outputFile: plan.outputFile,
	};
}
