import type { FatimaConfig } from ".";

export const markConfig = <T>(config: T) => {
	return {
		...config,
		fatimaConfigMarker: true,
	};
};

export const isFatimaConfig = (
	config: FatimaConfig,
): config is FatimaConfig => {
	return config.fatimaConfigMarker ?? false;
};
