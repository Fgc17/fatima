import fs from "node:fs/promises";
import { join } from "node:path";
import * as prettier from "prettier";
import { getCallerLocation } from "src/utils/get-caller-location";
import type { Adapter, Language, Validator } from "src/lib/types";

const getContent = async (filePath: string): Promise<string> => {
	const code = await fs.readFile(filePath, "utf-8");

	const lines = code.split("\n");
	const cleanLines = lines.filter((line) => line.trim() !== "");

	cleanLines.shift();
	cleanLines.pop();

	return cleanLines.join("\n");
};

const extractImports = (content: string): string[] => {
	const lines = content.split("\n");

	const reversedLines = lines.slice().reverse();

	const firstImportLineIndex = lines.findIndex(
		(line) => line.startsWith("import") || line.includes("require("),
	);

	if (firstImportLineIndex === -1) {
		return [];
	}

	const lastImportLineIndex =
		lines.length -
		reversedLines.findIndex(
			(line) => line.startsWith("import") || line.includes("require("),
		);

	const modules = lines.slice(firstImportLineIndex, lastImportLineIndex);

	return modules;
};

const extractUtils = (content: string): string[] => {
	const lines = content.split("\n");

	const reversedLines = lines.slice().reverse();

	const isESM = lines.every((line) => !line.includes("require"));

	let lastImportLineIndex = 0;

	if (isESM) {
		lastImportLineIndex =
			lines.length - reversedLines.findIndex((line) => line.includes("import"));
	} else {
		lastImportLineIndex =
			lines.length -
			reversedLines.findIndex((line) => line.includes("require"));
	}

	const exportLineIndex = lines.findIndex(
		(line) =>
			line.includes("export default") || line.includes("module.exports"),
	);

	const utils = lines.slice(lastImportLineIndex, exportLineIndex);

	return utils;
};

const extractDefaultExport = (content: string): string => {
	const exportLineIndex = content
		.split("\n")
		.findIndex(
			(line) =>
				line.startsWith("export default") || line.startsWith("module.exports"),
		);

	const defaultExport = content.split("\n").slice(exportLineIndex).join("\n");

	return defaultExport;
};

const buildMergedContent = async (
	language: Language,
	imports: string[],
	utils: string[],
	defaultExports: string[],
) => {
	const unfilteredModules = Array.from(imports).map((line) => {
		const pckg =
			line.match(/from ['"](.*)['"]/)?.at(1) ||
			line.match(/import ['"](.*)['"]/)?.at(1) ||
			line.match(/require\(['"](.*)['"]\)/)?.at(1);

		return pckg;
	});

	const filteredModules = unfilteredModules.filter(
		(m) => m && !["fatima/env", "env"].includes(m),
	) as string[];

	const modules = Array.from(new Set(filteredModules));

	let mergedContent = "";

	mergedContent += `${imports.join("\n")}\n\n`;

	mergedContent += `${utils.join("\n")}\n\n`;

	if (language === "typescript") {
		mergedContent += `export default config<Environment>({${defaultExports.join(
			"\n",
		)}});`;
	} else {
		mergedContent += `module.exports = config({${defaultExports.join("\n")}});`;
	}

	let formattedContent = "" as string;

	try {
		formattedContent = await prettier.format(mergedContent, {
			parser: "typescript",
		});
	} catch {
		throw new Error("Failed to format the merged content");
	}

	return { content: formattedContent, modules };
};

export async function createConfigFile({
	language,
	adapter,
	validator,
}: {
	language: Language;
	adapter: Adapter;
	validator: Validator;
}) {
	const { folderPath: thisFolderPath } = getCallerLocation();

	const mdxFilePath = `${language}.mdx`;
	const templatesPath = join(thisFolderPath, "templates");
	const baseMdxPath = join(templatesPath, "base", mdxFilePath);
	const adapterPath = join(templatesPath, "adapters", adapter, mdxFilePath);
	const validatorPath = join(
		templatesPath,
		"validators",
		validator,
		mdxFilePath,
	);

	const baseContent = await getContent(baseMdxPath);
	const adapterContent = await getContent(adapterPath);
	const validatorContent = await getContent(validatorPath);

	const baseImports = extractImports(baseContent);
	const loaderImports = extractImports(adapterContent);
	const validatorImports = extractImports(validatorContent);
	const allImports = [...baseImports, ...loaderImports, ...validatorImports];

	const validatorUtils = extractUtils(validatorContent);
	const baseUtils = extractUtils(baseContent);
	const loaderUtils = extractUtils(adapterContent);
	const utils = [...baseUtils, ...validatorUtils, ...loaderUtils];

	const adapterExport = extractDefaultExport(adapterContent);
	const validatorExport = extractDefaultExport(validatorContent);
	const baseExport = extractDefaultExport(baseContent);

	const joinedExports = [adapterExport, validatorExport, baseExport]
		.filter(Boolean)
		.map((exp) => (exp as string).split("\n").slice(1, -1).join("\n"));

	const { content, modules } = await buildMergedContent(
		language,
		allImports,
		utils,
		joinedExports,
	);

	const outputExtension = language === "typescript" ? "ts" : "js";
	const output = "env.config." + outputExtension;

	await fs.writeFile(output, content);

	return modules;
}
