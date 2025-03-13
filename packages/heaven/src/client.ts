import type { AnyType } from "lib/types";
import { getRuntime } from "./lib/get-runtime";
import { logger } from "lib/logger";

declare global {
	namespace Bun {
		interface Socket {
			data: Promise<AnyType>;
		}
		function connect(options: {
			hostname: string;
			port: number;
		}): Promise<AnyType>;
		function listen(options: {
			hostname: string;
			port: number;
		}): Promise<Socket>;
	}
}

declare global {
	namespace Deno {
		interface Conn {
			readable: ReadableStream<Uint8Array>;
		}
		function connect(options: {
			hostname: string;
			port: number;
		}): Promise<Conn>;
	}
}

interface EnvData {
	env: Record<string, string>;
	envCount: number;
}

interface CrossPlatformSocket {
	connect: (
		port: number,
		host: string,
		cb?: () => void,
	) => void | Promise<void>;
	on: (event: string, callback: (data?: AnyType) => void) => void;
	write?: (data: string) => void;
}

export function createHeavenClient(host: string, portLike: string | number) {
	let client: CrossPlatformSocket;
	const port = Number(portLike);
	const runtime = getRuntime();

	switch (runtime) {
		case "node": {
			const net = require("node:net");
			client = new net.Socket();
			break;
		}
		case "bun": {
			client = {
				connect: async (port: number, host: string, cb?: () => void) => {
					const conn = await Bun.connect({ hostname: host, port });
					if (cb) cb();
				},
				on: (event: string, callback: (data?: AnyType) => void) => {
					if (event === "data") {
						Bun.listen({ hostname: host, port }).then((socket) => {
							socket.data.then((data) => callback(data));
						});
					} else if (event === "close") {
						callback();
					} else if (event === "error") {
						callback(new Error("Bun connection error"));
					}
				},
			};
			break;
		}
		case "deno": {
			let conn: Deno.Conn;
			client = {
				connect: async (port: number, host: string, cb?: () => void) => {
					conn = await Deno.connect({ hostname: host, port });
					if (cb) cb();
				},
				on: (event: string, callback: (data?: AnyType) => void) => {
					if (event === "data") {
						(async () => {
							const decoder = new TextDecoder();
							for await (const chunk of conn.readable) {
								callback({ toString: () => decoder.decode(chunk) });
							}
						})();
					} else if (event === "close") {
						callback();
					} else if (event === "error") {
						callback(new Error("Deno connection error"));
					}
				},
			};
			break;
		}
		default:
			throw new Error(`Unsupported runtime: ${runtime}`);
	}

	client.connect(port, host);

	client.on("data", (data: { toString: () => string }) => {
		try {
			const dataString = data.toString().trim();
			const [envString] = dataString.split("\n");
			const { env, envCount } = JSON.parse(envString) as EnvData;

			Object.assign(process.env, env);

			logger.success(`Successfully reloaded process.env with ${envCount} envs`);
		} catch (err) {
			logger.error("Heaven error:", err);
		}
	});

	client.on("close", () => {
		logger.error("Heaven disconnected");
	});

	client.on("error", (err: Error) => {
		logger.error("Heaven error:", err.message);
	});

	return client;
}
