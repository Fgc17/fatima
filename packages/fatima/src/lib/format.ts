import {
	execSync,
	type ExecSyncOptionsWithStringEncoding,
} from "node:child_process";
import {
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

type FormatOptions = {
	formatter?: string;
	filePath?: string;
	cwd?: string;
};

type StringExecOptions = Omit<ExecSyncOptionsWithStringEncoding, "encoding">;

function shellQuote(value: string) {
	return JSON.stringify(value);
}

function runCommand(command: string, options: StringExecOptions) {
	return execSync(command, {
		...options,
		encoding: "utf8",
	});
}

function getPrettierParser(filePath?: string) {
	const extension = path.extname(filePath ?? "tmp.env.ts").toLowerCase();

	switch (extension) {
		case ".js":
		case ".cjs":
		case ".mjs":
			return "babel";
		case ".json":
			return "json";
		case ".ts":
		case ".cts":
		case ".mts":
		case ".tsx":
		default:
			return "typescript";
	}
}

async function formatWithCustomCommand(
	content: string,
	formatter: string,
	options: FormatOptions,
) {
	const cwd = options.cwd ?? process.cwd();
	const tempDir = mkdtempSync(path.join(tmpdir(), "fatima-format-"));
	const tempFilePath = path.join(
		tempDir,
		path.basename(options.filePath ?? "tmp.env.ts"),
	);

	writeFileSync(tempFilePath, content);

	try {
		const fileArg = shellQuote(tempFilePath);
		const command = formatter.includes("$1")
			? formatter.replaceAll("$1", fileArg)
			: `${formatter} ${fileArg}`;

		runCommand(command, { cwd });

		return readFileSync(tempFilePath, "utf8");
	} finally {
		rmSync(tempDir, { force: true, recursive: true });
	}
}

export const format = async (content: string, options: FormatOptions = {}) => {
	if (options.formatter) {
		return formatWithCustomCommand(content, options.formatter, options);
	}

	let formatCode = async () => content;

	const formatters = ["@biomejs/biome", "prettier"];

	let userFormatter = {
		name: "",
		path: "",
	};

	for (const formatter of formatters) {
		try {
			const formatterPath = path.dirname(
				require.resolve(formatter + "/package.json", {
					paths: [options.cwd ?? process.cwd()],
				}),
			);

			userFormatter = {
				name: formatter,
				path: formatterPath,
			};

			break;
		} catch {}
	}

	switch (userFormatter.name) {
		case "prettier": {
			const prettierPath = path.join(userFormatter.path, "index.mjs");

			const prettier = await import(prettierPath).then((mod) => mod.default);

			formatCode = () => {
				return prettier.format(content, {
					parser: getPrettierParser(options.filePath),
				});
			};

			break;
		}

		case "@biomejs/biome": {
			const biomeBinary = path.join(userFormatter.path, "bin/biome");
			const stdinFilePath = options.filePath ?? "tmp.env.ts";

			formatCode = async () =>
				runCommand(
					`${shellQuote(biomeBinary)} format --stdin-file-path=${shellQuote(stdinFilePath)}`,
					{
						input: content,
						cwd: options.cwd ?? process.cwd(),
					},
				);

			break;
		}
	}

	return await formatCode();
};
