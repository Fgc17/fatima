type FatimaStore = {
	environment: string;
	configPath: string;
	logs: string;
	transformedConfigPath: string;
	heavenPort: string;
	storeMarker: string;
	envNames: string;
	liteMode: string | undefined;
	debug: string | undefined;
	devMode: string | undefined;
};

export const fatimaStore = {
	get<K extends keyof FatimaStore>(key: K) {
		return process.env[`fatima_${key}`] as FatimaStore[K];
	},
	set(key: keyof FatimaStore, value?: string) {
		process.env[`fatima_${key}`] = value?.toLowerCase().trim();
	},
	exists() {
		return process.env.fatimaStoreMarker === "true";
	},
};
