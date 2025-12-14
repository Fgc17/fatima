import net from "node:net";
import type { Promisable } from "lib/utils/types";
import { wording } from "lib/wording";

export const createHeavenServer = <T>(
	port: number | string,
	getSendEventData: () => Promisable<T>,
) => {
	const clients = new Set<net.Socket>();

	const send = async () => {
		const data = await getSendEventData();

		return Promise.all(
			Array.from(clients).map((c) => {
				try {
					return c.write(JSON.stringify(data) + "\n");
				} catch {
					return 0;
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

				await send();

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

	server.on("error", (err) => {
		if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
			throw new Error(wording.error.heavenPortAlreadyInUse(port), {
				cause: err,
			});
		}
	});

	const shutdown = async () => {
		for (const client of clients) {
			client.destroy();
		}
		server.close();
	};

	return {
		send,
		shutdown,
		server,
	};
};
