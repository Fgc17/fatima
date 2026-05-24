import type { FatimaGenerator } from "../plugins/types";
import { javascriptGenerator } from "./javascript";
import { pythonGenerator } from "./python";
import { typescriptGenerator } from "./typescript";

export const builtinGenerators: Record<string, FatimaGenerator> = {
	typescript: typescriptGenerator,
	javascript: javascriptGenerator,
	python: pythonGenerator,
};
