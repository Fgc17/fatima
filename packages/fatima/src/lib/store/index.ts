import type { FatimaConfig } from "lib/config";
import type { UnsafeEnvironmentVariables } from "lib/types";

type FatimaStore = {
	environment: string;
	configPath: string;
	logs: number;
	transformedConfigPath: string;
	heavenPort: string;
	storeMarker: boolean;
	envNames: string[];
	liteMode: boolean;
	debug: boolean;
	devMode: boolean;
};

type Prefix = "u:" | "n:" | "b:" | "i:" | "s:" | "a:";

type SerializedValue = `${Prefix}${string}`;

const serialize = <T>(value: T): string => {
	if (value === undefined) return "u:";

	if (value === null) return "n:" + String(value);

	if (typeof value === "boolean") return value ? "b:t" : "b:f";

	if (typeof value === "number") return "i:";

	if (Array.isArray(value))
		return "a:" + value.map(encodeURIComponent).join("&");

	return "s:" + String(value).trim();
};

const deserialize = <T>(serializedValue: SerializedValue | undefined): T => {
	const type = serializedValue?.slice(0, 2) as Prefix;

	const value = serializedValue?.slice(2);

	if (value === undefined || type === "u:") return undefined as T;

	if (type === "n:") return null as T;

	if (type === "b:") return (value === "t") as T;

	if (type === "i:") return Number(value) as T;

	if (type === "s:") return value as T;

	if (type === "a:") return value.split("&").map(decodeURIComponent) as T;

	throw new Error(`Invalid serialized value: ${value}`);
};

export const fatimaStore = {
	initialize(config: FatimaConfig, options: Record<string, string | boolean>) {
		this.set("envNames", []);

		this.set("storeMarker", true);

		this.set(
			"environment",
			config.environment(process.env as UnsafeEnvironmentVariables),
		);

		this.set("configPath", config.file.path);

		this.set("heavenPort", String(config.heaven));

		this.set("liteMode", Boolean(options.lite));
		this.set("debug", Boolean(options.debug));
		this.set("devMode", Boolean(options.devMode));
	},

	get<K extends keyof FatimaStore>(key: K): FatimaStore[K] {
		const rawValue = process.env[`fatima_${key}`] as SerializedValue;
		return deserialize(rawValue);
	},

	set<K extends keyof FatimaStore>(key: K, value?: FatimaStore[K]) {
		process.env[`fatima_${key}`] = serialize(value);
	},

	exists() {
		return this.get("storeMarker");
	},
};
