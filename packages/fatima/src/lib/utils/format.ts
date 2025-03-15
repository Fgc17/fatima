import { debug } from "lib/debugger";
import { execSync } from "node:child_process";
import path from "node:path";

export const format = async (content: string) => {
	let formatCode = async () => content;

	const formatters = ["@biomejs/biome", "prettier"];

	let userFormatter = {
		name: "",
		path: "",
	};

	for (const formatter of formatters) {
		try {
			const formatterPath = path.dirname(
				require.resolve(formatter + "/package.json"),
			);

			userFormatter = {
				name: formatter,
				path: formatterPath,
			};

			break;
		} catch (e) {
			debug.error(e);
		}
	}

	switch (userFormatter.name) {
		case "prettier": {
			const prettier = await import(userFormatter.path).then(
				(mod) => mod.default,
			);

			formatCode = () => {
				return prettier.format(content, {
					parser: "typescript",
				});
			};

			break;
		}

		case "@biomejs/biome": {
			const biomeBinary = path.join(userFormatter.path, "bin/biome");

			formatCode = async () =>
				execSync(`${biomeBinary} format --stdin-file-path=tmp.env.ts`, {
					input: content,
				}).toString();

			break;
		}
	}

	return await formatCode();
};
