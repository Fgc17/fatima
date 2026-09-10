import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createWasmHost, type WasmHostOptions } from "./host.js";
import init, { handle_api_request_json } from "./wasm/fatima_wasm.js";

let initialized: Promise<void> | undefined;

async function ensureInitialized() {
	initialized ??= readFile(
		fileURLToPath(new URL("./wasm/fatima_wasm_bg.wasm", import.meta.url)),
	)
		.then((bytes) =>
			init({
				module_or_path: new Uint8Array(
					bytes.buffer.slice(
						bytes.byteOffset,
						bytes.byteOffset + bytes.byteLength,
					),
				),
			}),
		)
		.then(() => undefined);
	await initialized;
}

export async function handleApiRequest(
	input: string,
	options: WasmHostOptions = {},
): Promise<string> {
	await ensureInitialized();
	return handle_api_request_json(input, createWasmHost(options));
}
