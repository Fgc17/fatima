import { createScaffoldPlan } from "./presets";
import { writeConfigFile } from "./render-config-file";
import { applyUserConfigTweaks } from "./tweaks";
import type { Adapter, Generator, ModelPreset } from "./types";

export async function createInit({
	generator,
	adapter,
	modelPreset,
}: {
	generator: Generator;
	adapter: Adapter;
	modelPreset: ModelPreset;
}) {
	const plan = createScaffoldPlan({ generator, adapter, modelPreset });

	await writeConfigFile(plan);
	applyUserConfigTweaks(generator);

	return {
		dependencies: plan.dependencies,
		outputFile: plan.outputFile,
	};
}
