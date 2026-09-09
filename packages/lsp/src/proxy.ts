import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { encodeFrame, type Frame } from "./framing.ts";
import { createRouter, type ProxyServer } from "./router.ts";

const CONFIG_KEY = "typescript-oxlint";

type ServerConfig = { args: string[]; bin: string; name: string };

function argValue(name: string): string | null {
	const index = process.argv.indexOf(name);
	if (index < 0) return null;
	return process.argv[index + 1] ?? null;
}

function isServerConfig(entry: unknown): entry is ServerConfig {
	if (typeof entry !== "object" || entry === null) return false;
	const candidate = entry as Record<string, unknown>;
	return (
		typeof candidate.name === "string" &&
		typeof candidate.bin === "string" &&
		Array.isArray(candidate.args)
	);
}

function readServerConfigs(project: string): ServerConfig[] {
	const raw = readFileSync(join(project, ".agents", ".lsp.json"), "utf8");
	const parsed = JSON.parse(raw) as Record<string, { servers?: unknown }>;
	const servers = parsed[CONFIG_KEY]?.servers;
	if (!Array.isArray(servers) || !servers.every(isServerConfig)) {
		throw new Error(
			`.agents/.lsp.json: "${CONFIG_KEY}.servers" must be a list of {name, bin, args}`,
		);
	}
	return servers;
}

function startServer(
	name: string,
	command: string,
	args: string[],
	cwd: string,
): ProxyServer {
	return { name, process: spawn(command, args, { cwd }) };
}

function main() {
	const project = argValue("--project") ?? process.cwd();
	const binary = (name: string) => join(project, "node_modules", ".bin", name);

	const servers = readServerConfigs(project).map((config) =>
		startServer(config.name, binary(config.bin), config.args, project),
	);

	let stopping = false;
	const stop = (code: number) => {
		if (stopping) return;
		stopping = true;
		for (const server of servers) server.process.kill();
		process.exit(code);
	};

	const read = createRouter({
		servers,
		write: (frame: Frame) => {
			process.stdout.write(encodeFrame(frame));
		},
	});

	process.stdin.on("data", read);
	process.stdin.on("end", () => stop(0));
	for (const server of servers) {
		server.process.on("exit", () => stop(0));
		server.process.on("error", () => stop(1));
	}
}

main();
