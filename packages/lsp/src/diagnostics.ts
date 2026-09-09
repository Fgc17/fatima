import type { Frame } from "./framing.ts";

export type MergedDiagnostics = { diagnostics: unknown[]; uri: string };

export function createDiagnosticsMerger() {
	const bySource = new Map<string, Map<string, unknown[]>>();

	return (source: string, params: Frame): MergedDiagnostics | null => {
		const uri = params.uri;
		const diagnostics = params.diagnostics;
		if (typeof uri !== "string" || !Array.isArray(diagnostics)) return null;

		const sources = bySource.get(uri) ?? new Map<string, unknown[]>();
		sources.set(source, diagnostics);
		bySource.set(uri, sources);

		const merged: unknown[] = [];
		for (const list of sources.values()) merged.push(...list);
		return { diagnostics: merged, uri };
	};
}
