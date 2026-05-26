export type Tone = "brand" | "success" | "warning" | "danger" | "muted";

export const theme = {
	fg: "#f2f2f2",
	bg: "#070707",
	brand: "#f2f2f2",
	primary: "#f2f2f2",
	secondary: "#b8b8b8",
	accent: "#f2f2f2",
	info: "#b8b8b8",
	success: "#f2f2f2",
	warning: "#f2f2f2",
	danger: "#f2f2f2",
	muted: "#8a8a8a",
	faint: "#555555",
	ghost: "#333333",
	surface: "#0d0d0d",
	surfaceAlt: "#151515",
	surfaceElevated: "#1c1c1c",
	modalBackdrop: "#070707",
	modalSurface: "#111111",
	inputSurface: "#151515",
	inputSurfaceInactive: "#151515",
	selectedBg: "#f2f2f2",
	selectedFg: "#070707",
	border: "#2a2a2a",
	borderActive: "#666666",
	borderMuted: "#333333",
	shadow: "#000000",
} as const;

export function toneColor(tone: Tone = "brand") {
	return {
		brand: theme.brand,
		success: theme.success,
		warning: theme.warning,
		danger: theme.danger,
		muted: theme.muted,
	}[tone];
}

export function toneBackground(tone: Tone = "brand") {
	return {
		brand: theme.surfaceElevated,
		success: theme.surfaceElevated,
		warning: theme.surfaceElevated,
		danger: theme.surfaceElevated,
		muted: theme.surfaceAlt,
	}[tone];
}

export function environmentTone(environment: string): Tone {
	return environment.toLowerCase() === "production" ? "warning" : "brand";
}
