import { type Frame, recordField } from "./framing.ts";
import { PULL_DEBOUNCE_MS, PULL_DIAGNOSTICS } from "./protocol.ts";
import { send, type RouterState } from "./state.ts";

function documentUri(frame: Frame): string | null {
	const params = recordField(frame, "params");
	const document = params === null ? null : recordField(params, "textDocument");
	const uri = document?.uri;
	return typeof uri === "string" ? uri : null;
}

function pullDiagnostics(state: RouterState, uri: string) {
	for (const server of state.servers) {
		state.nextRequestId += 1;
		const id = `proxy/diagnostic/${state.nextRequestId}`;
		state.internalRequests.set(id, uri);
		send(server, {
			id,
			jsonrpc: "2.0",
			method: PULL_DIAGNOSTICS,
			params: { textDocument: { uri } },
		});
	}
}

export function schedulePull(state: RouterState, frame: Frame, method: string) {
	if (method === "textDocument/didClose") return;
	const uri = documentUri(frame);
	if (uri === null) return;
	const running = state.pullTimers.get(uri);
	if (running) clearTimeout(running);
	const timer = setTimeout(() => {
		state.pullTimers.delete(uri);
		pullDiagnostics(state, uri);
	}, PULL_DEBOUNCE_MS);
	timer.unref();
	state.pullTimers.set(uri, timer);
}
