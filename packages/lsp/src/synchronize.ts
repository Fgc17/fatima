import { type Frame, idField, recordField, stringField } from "./framing.ts";
import { PULL_DIAGNOSTICS } from "./protocol.ts";
import { broadcast, type Pending, type RouterState } from "./state.ts";

export function startSynchronized(state: RouterState, frame: Frame) {
	const id = idField(frame);
	const method = stringField(frame, "method") ?? "";
	if (id !== null)
		state.pending.set(String(id), {
			id,
			method,
			responses: new Map(),
			waiting: state.servers.length,
		});
	broadcast(state, frame);
}

function resultField(frame: Frame, key: string): Frame | null {
	const result = recordField(frame, "result");
	return result ? recordField(result, key) : null;
}

function firstResponse(
	state: RouterState,
	responses: Map<string, Frame>,
): Frame | null {
	for (const server of state.servers) {
		const frame = responses.get(server.name);
		if (frame) return frame;
	}
	return null;
}

function mergeCapabilities(
	state: RouterState,
	responses: Map<string, Frame>,
): Record<string, unknown> {
	const merged: Record<string, unknown> = {};
	for (const server of state.servers) {
		const frame = responses.get(server.name);
		if (!frame) continue;
		const capabilities = resultField(frame, "capabilities");
		if (!capabilities) continue;
		state.capabilities.set(server.name, capabilities);
		for (const [key, value] of Object.entries(capabilities)) {
			if (!(key in merged)) merged[key] = value;
		}
	}
	return merged;
}

function mergePulledDiagnostics(entry: Pending): Frame {
	const items: unknown[] = [];
	for (const frame of entry.responses.values()) {
		const result = recordField(frame, "result");
		if (result?.kind === "full" && Array.isArray(result.items))
			items.push(...result.items);
	}
	return { id: entry.id, jsonrpc: "2.0", result: { items, kind: "full" } };
}

export function mergeSynchronized(state: RouterState, entry: Pending): Frame {
	if (entry.method === PULL_DIAGNOSTICS) return mergePulledDiagnostics(entry);
	const first = firstResponse(state, entry.responses);
	if (entry.method !== "initialize") {
		return first ?? { id: entry.id, jsonrpc: "2.0", result: null };
	}
	const capabilities = mergeCapabilities(state, entry.responses);
	const serverInfo = first ? resultField(first, "serverInfo") : null;
	return {
		id: entry.id,
		jsonrpc: "2.0",
		result: serverInfo ? { capabilities, serverInfo } : { capabilities },
	};
}
