import net from "node:net";
import { populateEnv, logger } from "src/lib/lib";

export function createHeavenClient(host: string, port: string | number) {
	const client = new net.Socket();

	client.connect(Number(port), host);

	client.on("data", (data: { toString: () => string }) => {
		const dataString = data.toString().trim();

		const [envString] = dataString.split("\n");

		const { env, envCount } = JSON.parse(envString);

		populateEnv(env);

		logger.success(`Successfully reloaded process.env with ${envCount} envs`);
	});

	client.on("close", () => {
		console.log("Connection closed");
	});

	client.on("error", (err) => {
		console.error("Client error:", err.message);
	});

	return client;
}
