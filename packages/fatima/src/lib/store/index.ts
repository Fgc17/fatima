import type { FatimaConfig } from "core/config";
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
	strictMode: boolean;
	skipLoading: boolean;
};

type Prefix = "u:" | "n:" | "b:" | "i:" | "s:" | "a:";

type SerializedValue = `${Prefix}${string}`;

const serialize = <T>(value: T): string => {
	if (value === undefined) return "u:";

	if (value === null) return "n:" + String(value);

	if (typeof value === "boolean") return value ? "b:t" : "b:f";

	if (typeof value === "number") return "i:" + String(value);

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
	initialize(options: Record<string, string | boolean>) {
		this.set("storeMarker", true);
		this.set("logs", 0);
		this.set("envNames", []);

		this.set("liteMode", Boolean(options.lite));
		this.set("devMode", Boolean(options.devMode));
		this.set("strictMode", Boolean(options.strict));
		this.set("debug", Boolean(options.debug));
		this.set("skipLoading", Boolean(options.processEnv));

		options.environment &&
			this.set("environment", options.environment.toString());
	},
	postInitialize(config: FatimaConfig) {
		this.set(
			"environment",
			this.get("environment") ??
				config.environment(process.env as UnsafeEnvironmentVariables),
		);

		this.set("configPath", config.file.path);

		this.set("heavenPort", String(config.heaven));
	},
	get<K extends keyof FatimaStore>(key: K): FatimaStore[K] {
		const rawValue = process.env[`fatima_${key}`] as SerializedValue;
		return deserialize(rawValue);
	},

	set<K extends keyof FatimaStore>(key: K, value?: FatimaStore[K]) {
		const serializedValue = serialize(value);

		Object.assign(process.env, {
			[`fatima_${key}`]: serializedValue,
		});
	},

	exists() {
		return this.get("storeMarker");
	},
};
