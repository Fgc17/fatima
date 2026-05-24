import { createScaffoldPlan } from "./lib/presets";
import { writeConfigFile } from "./lib/render-config-file";
import { applyUserConfigTweaks } from "./lib/tweaks";
import type { Adapter, Generator, Validator } from "./lib/types";

export async function create({
	generator,
	adapter,
	validator,
}: {
	generator: Generator;
	adapter: Adapter;
	validator: Validator;
}) {
	const plan = createScaffoldPlan({ generator, adapter, validator });

	await writeConfigFile(plan);
	applyUserConfigTweaks(generator);

	return {
		dependencies: plan.dependencies,
		outputFile: plan.outputFile,
	};
}
