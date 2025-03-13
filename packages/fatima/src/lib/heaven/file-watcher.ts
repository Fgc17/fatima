import type { Promisable } from "lib/types";
import { watch } from "node:fs";
import { debounce } from "../utils/debounce";

export function createFileWatcher(reload?: () => Promisable<void>) {
	return watch(
		process.cwd(),
		debounce(async (_, filename: string | null) => {
			if (
				!filename ||
				!filename.endsWith(".env") ||
				filename.startsWith(".tmp") ||
				filename === ".example.env"
			)
				return;

			await reload?.();
		}, 100),
	);
}
