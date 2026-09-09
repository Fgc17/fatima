import { createDiagnosticsMerger } from "./diagnostics.ts";
import { encodeFrame, type Frame, idField } from "./framing.ts";
import { CAPABILITY_BY_METHOD } from "./protocol.ts";

import type { ChildProcessWithoutNullStreams } from "node:child_process";

export type ProxyServer = {
	name: string;
	process: ChildProcessWithoutNullStreams;
};

export type Pending = {
	id: number | string;
	method: string;
	responses: Map<string, Frame>;
	waiting: number;
};

export type RouterState = {
	capabilities: Map<string, Frame>;
	internalRequests: Map<string, string>;
	merge: ReturnType<typeof createDiagnosticsMerger>;
	nextRequestId: number;
	pending: Map<string, Pending>;
	pullTimers: Map<string, ReturnType<typeof setTimeout>>;
	requestOrigin: Map<string, string>;
	servers: ProxyServer[];
	write: (frame: Frame) => void;
};

export function send(server: ProxyServer, frame: Frame) {
	server.process.stdin.write(encodeFrame(frame));
}

export function broadcast(state: RouterState, frame: Frame) {
	for (const server of state.servers) send(server, frame);
}

export function serverByName(
	state: RouterState,
	name: string,
): ProxyServer | undefined {
	return state.servers.find((server) => server.name === name);
}

export function firstServer(state: RouterState): ProxyServer {
	const server = state.servers[0];
	if (!server) throw new Error("lsp proxy: no servers configured");
	return server;
}

export function isUpstreamVoice(state: RouterState, server: ProxyServer) {
	return server === firstServer(state);
}

export function routeClientResponse(state: RouterState, frame: Frame) {
	const id = idField(frame);
	if (id === null) return;
	const key = String(id);
	const origin = state.requestOrigin.get(key);
	state.requestOrigin.delete(key);
	const server = origin ? serverByName(state, origin) : undefined;
	if (server) send(server, frame);
}

export function capableServer(state: RouterState, method: string): ProxyServer {
	const key = CAPABILITY_BY_METHOD[method];
	if (key) {
		let match: ProxyServer | null = null;
		for (const server of state.servers) {
			const capabilities = state.capabilities.get(server.name);
			if (capabilities && capabilities[key]) match = server;
		}
		if (match) return match;
	}
	return firstServer(state);
}

export function createInitialState(input: {
	servers: ProxyServer[];
	write: (frame: Frame) => void;
}): RouterState {
	return {
		capabilities: new Map(),
		internalRequests: new Map(),
		merge: createDiagnosticsMerger(),
		nextRequestId: 0,
		pending: new Map(),
		pullTimers: new Map(),
		requestOrigin: new Map(),
		servers: input.servers,
		write: input.write,
	};
}
