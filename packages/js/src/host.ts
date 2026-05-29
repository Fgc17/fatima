import { spawn } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import process from "node:process";

export type WasmHostOptions = {
	cwd?: string;
};

export function createWasmHost(options: WasmHostOptions = {}) {
	const cwd = options.cwd ?? process.cwd();
	return {
		envVars: () =>
			Object.fromEntries(
				Object.entries(process.env).filter(
					(entry): entry is [string, string] => typeof entry[1] === "string",
				),
			),
		envVar: (key: string) => process.env[key] ?? null,
		currentDir: () => cwd,
		exists: (path: string) => existsSync(path),
		readText: (path: string) => fs.readFile(path, "utf8"),
		writeText: (path: string, content: string) => fs.writeFile(path, content),
		createDirAll: (path: string) => fs.mkdir(path, { recursive: true }),
		removeFile: async (path: string) => {
			try {
				await fs.unlink(path);
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
			}
		},
		processId: () => process.pid,
		runCommand: (request: {
			command: string;
			args: string[];
			cwd: string;
			env: Record<string, string>;
		}) => runCommand(request),
		httpJson: (request: HttpJsonRequest) => httpJson(request),
	};
}

type HttpJsonRequest = {
	method: string;
	url: string;
	headers: Record<string, string>;
	query: [string, string][];
	body?: unknown;
	bearer?: string;
};

async function httpJson(request: HttpJsonRequest): Promise<unknown> {
	const url = new URL(request.url);
	for (const [key, value] of request.query) url.searchParams.append(key, value);
	const headers = new Headers(request.headers);
	if (request.bearer) headers.set("authorization", `Bearer ${request.bearer}`);
	if (
		request.body !== undefined &&
		request.body !== null &&
		!headers.has("content-type")
	) {
		headers.set("content-type", "application/json");
	}
	const response = await fetch(url, {
		method: request.method,
		headers,
		body:
			request.body === undefined || request.body === null
				? undefined
				: JSON.stringify(request.body),
	});
	if (!response.ok)
		throw new Error(
			`HTTP ${response.status} ${response.statusText}: ${await response.text()}`,
		);
	return response.json();
}

function runCommand(request: {
	command: string;
	args: string[];
	cwd: string;
	env: Record<string, string>;
}) {
	return new Promise<{ success: boolean; stdout: string; stderr: string }>(
		(resolve, reject) => {
			const child = spawn(request.command, request.args, {
				cwd: request.cwd,
				env: { ...process.env, ...request.env },
				stdio: ["ignore", "pipe", "pipe"],
			});
			let stdout = "";
			let stderr = "";
			child.stdout.setEncoding("utf8");
			child.stderr.setEncoding("utf8");
			child.stdout.on("data", (chunk: string) => {
				stdout += chunk;
			});
			child.stderr.on("data", (chunk: string) => {
				stderr += chunk;
			});
			child.on("error", reject);
			child.on("close", (code) =>
				resolve({ success: code === 0, stdout, stderr }),
			);
		},
	);
}
