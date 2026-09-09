export const DOCUMENT_NOTIFICATIONS = new Set([
	"textDocument/didChange",
	"textDocument/didClose",
	"textDocument/didOpen",
	"textDocument/didSave",
]);

export const BROADCAST_NOTIFICATIONS = new Set(["exit", "initialized"]);
export const PUBLISH_DIAGNOSTICS = "textDocument/publishDiagnostics";
export const PULL_DIAGNOSTICS = "textDocument/diagnostic";
export const SYNCHRONIZED_REQUESTS = new Set([
	"initialize",
	"shutdown",
	PULL_DIAGNOSTICS,
]);
export const PULL_DEBOUNCE_MS = 150;

export const CAPABILITY_BY_METHOD: Record<string, string> = {
	"callHierarchy/incomingCalls": "callHierarchyProvider",
	"callHierarchy/outgoingCalls": "callHierarchyProvider",
	"textDocument/definition": "definitionProvider",
	"textDocument/documentSymbol": "documentSymbolProvider",
	"textDocument/formatting": "documentFormattingProvider",
	"textDocument/hover": "hoverProvider",
	"textDocument/implementation": "implementationProvider",
	"textDocument/prepareCallHierarchy": "callHierarchyProvider",
	"textDocument/rangeFormatting": "documentRangeFormattingProvider",
	"textDocument/references": "referencesProvider",
	"workspace/symbol": "workspaceSymbolProvider",
};
