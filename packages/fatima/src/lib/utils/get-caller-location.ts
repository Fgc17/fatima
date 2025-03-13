import path from "node:path";

export function getCallerLocation(index = 0) {
	const callerStack = new Error().stack || "";

	const callerLine = callerStack.split("\n")[3 + index];
	const callerFileMatch =
		callerLine.match(/\((.*):\d+:\d+\)$/) ||
		callerLine.match(/at (.*):\d+:\d+/);
	const filePath = callerFileMatch ? callerFileMatch[1] : "unknown";
	const folderPath = path.dirname(filePath);

	return { filePath, folderPath };
}
