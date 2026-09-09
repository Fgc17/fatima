import { schedulePull } from "./diagnostic-pull.ts";
import { createFrameReader, type Frame, stringField } from "./framing.ts";
import {
	BROADCAST_NOTIFICATIONS,
	DOCUMENT_NOTIFICATIONS,
	SYNCHRONIZED_REQUESTS,
} from "./protocol.ts";
import { handleServerFrame } from "./server-frame.ts";
import {
	broadcast,
	capableServer,
	createInitialState,
	type ProxyServer,
	type RouterState,
	routeClientResponse,
	send,
} from "./state.ts";
import { startSynchronized } from "./synchronize.ts";

export type { ProxyServer } from "./state.ts";

function handleClientFrame(state: RouterState, frame: Frame) {
	const method = stringField(frame, "method");
	if (method === null) {
		routeClientResponse(state, frame);
		return;
	}
	if (SYNCHRONIZED_REQUESTS.has(method)) {
		startSynchronized(state, frame);
		return;
	}
	if (DOCUMENT_NOTIFICATIONS.has(method)) {
		broadcast(state, frame);
		schedulePull(state, frame, method);
		return;
	}
	if (BROADCAST_NOTIFICATIONS.has(method)) {
		broadcast(state, frame);
		return;
	}
	send(capableServer(state, method), frame);
}

export function createRouter(input: {
	servers: ProxyServer[];
	write: (frame: Frame) => void;
}) {
	const state = createInitialState(input);

	for (const server of state.servers) {
		const read = createFrameReader((frame) =>
			handleServerFrame(state, server, frame),
		);
		server.process.stdout.on("data", read);
		server.process.stderr.on("data", (chunk: Buffer) => {
			process.stderr.write(`[${server.name}] ${chunk.toString("utf8")}`);
		});
	}

	return createFrameReader((frame) => handleClientFrame(state, frame));
}
