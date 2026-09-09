import { type Frame, idField, recordField, stringField } from "./framing.ts";
import { PUBLISH_DIAGNOSTICS } from "./protocol.ts";
import {
	isUpstreamVoice,
	type ProxyServer,
	type RouterState,
	send,
} from "./state.ts";
import { mergeSynchronized } from "./synchronize.ts";

function publishMerged(state: RouterState, server: ProxyServer, frame: Frame) {
	const params = recordField(frame, "params");
	if (!params) return;
	const merged = state.merge(server.name, params);
	if (!merged) return;
	state.write({ jsonrpc: "2.0", method: PUBLISH_DIAGNOSTICS, params: merged });
}

function mutedServerReply(frame: Frame): unknown {
	if (stringField(frame, "method") !== "workspace/configuration") return null;
	const items = recordField(frame, "params")?.items;
	if (!Array.isArray(items)) return null;
	return items.map(() => null);
}

function forwardServerRequest(
	state: RouterState,
	server: ProxyServer,
	frame: Frame,
	id: number | string,
) {
	if (isUpstreamVoice(state, server)) {
		state.requestOrigin.set(String(id), server.name);
		state.write(frame);
		return;
	}
	send(server, { id, jsonrpc: "2.0", result: mutedServerReply(frame) });
}

function pulledItems(result: Frame | null): unknown[] | null {
	if (result === null || result.kind !== "full") return null;
	return Array.isArray(result.items) ? result.items : null;
}

function completeInternal(
	state: RouterState,
	server: ProxyServer,
	key: string,
	frame: Frame,
): boolean {
	const uri = state.internalRequests.get(key);
	if (uri === undefined) return false;
	state.internalRequests.delete(key);
	const items = pulledItems(recordField(frame, "result"));
	if (items === null) return true;
	const merged = state.merge(server.name, { diagnostics: items, uri });
	if (merged)
		state.write({
			jsonrpc: "2.0",
			method: PUBLISH_DIAGNOSTICS,
			params: merged,
		});
	return true;
}

function completeResponse(
	state: RouterState,
	server: ProxyServer,
	frame: Frame,
	id: number | string,
) {
	const key = String(id);
	if (completeInternal(state, server, key, frame)) return;
	const entry = state.pending.get(key);
	if (!entry) {
		state.write(frame);
		return;
	}
	entry.responses.set(server.name, frame);
	entry.waiting -= 1;
	if (entry.waiting > 0) return;
	state.pending.delete(key);
	state.write(mergeSynchronized(state, entry));
}

export function handleServerFrame(
	state: RouterState,
	server: ProxyServer,
	frame: Frame,
) {
	const method = stringField(frame, "method");
	const id = idField(frame);
	if (method === PUBLISH_DIAGNOSTICS) {
		publishMerged(state, server, frame);
		return;
	}
	if (method !== null && id !== null) {
		forwardServerRequest(state, server, frame, id);
		return;
	}
	if (method !== null) {
		if (isUpstreamVoice(state, server)) state.write(frame);
		return;
	}
	if (id !== null) completeResponse(state, server, frame, id);
}
