type FatimaStore = {
	logs: number;
	environment: string;
	storeMarker: boolean;
	heavenPort: string;
	devMode: boolean;
};

const serialize = <T>(value: T): string => {
	if (value === undefined) return "u:";

	if (value === null) return "n:" + String(value);

	if (typeof value === "boolean") return value ? "b:t" : "b:f";

	if (typeof value === "number") return "i:";

	return "s:" + String(value).trim();
};

const deserialize = <T>(value: string | undefined): T => {
	if (value === undefined || value === "u:") return undefined as T;

	if (value.startsWith("n:")) return null as T;

	if (value.startsWith("b:")) return (value === "b:t") as T;

	if (value.startsWith("i:")) return Number(value) as T;

	if (value.startsWith("s:")) return value.slice(2) as T;

	throw new Error(`Invalid serialized value: ${value}`);
};

export const fatimaStore = {
	get<K extends keyof FatimaStore>(key: K): FatimaStore[K] {
		const rawValue = process.env[`fatima_${key}`];
		return deserialize(rawValue);
	},

	set<K extends keyof FatimaStore>(key: K, value?: FatimaStore[K]) {
		process.env[`fatima_${key}`] = serialize(value);
	},

	exists() {
		return this.get("storeMarker");
	},
};
