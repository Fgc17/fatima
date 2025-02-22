import type { Promisable } from "@fatimajs/tools/lib";
import { lifecycle } from "../lifecycle";
import net from "node:net";

export const createHeavenServer = <T>(
	port: number | string,
	getSendEventData: () => Promisable<T>,
) => {
	const clients = new Set<net.Socket>();

	const sendDataToHeavenClient = async () => {
		const data = await getSendEventData();

		return Promise.all(
			Array.from(clients).map((c) => {
				try {
					c.write(JSON.stringify(data) + "\n");
				} catch (error) {
					console.error("Error writing to client:", error);
				}
			}),
		);
	};

	const server = net.createServer((socket) => {
		socket.on("data", async (data) => {
			const dataString = data.toString().trim();

			const dataLines = dataString.split("\n");

			let isHttpRequest = false;

			if (dataLines[0].includes("HTTP")) {
				isHttpRequest = true;
			}

			if (isHttpRequest) {
				clients.delete(socket);

				await sendDataToHeavenClient();

				socket.write(
					"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 2\r\n\r\nOK",
				);

				return socket.end();
			}
		});

		socket.on("error", (err) => {
			console.error("Socket error:", err);
		});

		clients.add(socket);
	});

	server.listen(Number(port));

	server.on("error", (error) => {
		if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
			lifecycle.error.heavenPortAlreadyInUse(port);
		}
	});

	return {
		send: sendDataToHeavenClient,
		server,
	};
};
