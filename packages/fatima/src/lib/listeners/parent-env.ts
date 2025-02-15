import net from "node:net";
import { populateEnv } from "../env/patch-env";
import { instrumentationPortAlreadyInUse } from "src/core/lifecycle/error";

export function listenParentEnv(port: number) {
	const tcpServer = net.createServer((socket) => {
		socket.on("data", (data) => {
			try {
				const message = JSON.parse(data.toString());
				if (message.type === "update-env") {
					populateEnv(message.env);
				}
			} catch {}
		});
	});

	tcpServer.listen(port);

	tcpServer.on("error", (error) => {
		if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
			instrumentationPortAlreadyInUse(port);
		}
	});
}
