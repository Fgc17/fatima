const HEADER_SEPARATOR = "\r\n\r\n";

export type Frame = Record<string, unknown>;

function isRecord(value: unknown): value is Frame {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stringField(frame: Frame, key: string): string | null {
	const value = frame[key];
	return typeof value === "string" ? value : null;
}

export function idField(frame: Frame): number | string | null {
	const value = frame.id;
	if (typeof value === "number" || typeof value === "string") return value;
	return null;
}

export function recordField(frame: Frame, key: string): Frame | null {
	const value = frame[key];
	return isRecord(value) ? value : null;
}

export function encodeFrame(frame: Frame): Buffer {
	const body = Buffer.from(JSON.stringify(frame), "utf8");
	const header = `Content-Length: ${body.length}${HEADER_SEPARATOR}`;
	return Buffer.concat([Buffer.from(header, "ascii"), body]);
}

function contentLength(header: string): number | null {
	for (const line of header.split("\r\n")) {
		const separator = line.indexOf(":");
		if (separator < 0) continue;
		if (line.slice(0, separator).trim().toLowerCase() !== "content-length")
			continue;
		const parsed = Number.parseInt(line.slice(separator + 1).trim(), 10);
		return Number.isNaN(parsed) ? null : parsed;
	}
	return null;
}

function parseFrame(text: string): Frame | null {
	try {
		const parsed: unknown = JSON.parse(text);
		return isRecord(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function createFrameReader(onFrame: (frame: Frame) => void) {
	let pending = Buffer.alloc(0);

	return (chunk: Buffer) => {
		pending = Buffer.concat([pending, chunk]);
		for (;;) {
			const headerEnd = pending.indexOf(HEADER_SEPARATOR);
			if (headerEnd < 0) return;
			const bodyStart = headerEnd + HEADER_SEPARATOR.length;
			const length = contentLength(
				pending.subarray(0, headerEnd).toString("ascii"),
			);
			if (length === null) {
				pending = pending.subarray(bodyStart);
				continue;
			}
			if (pending.length < bodyStart + length) return;
			const frame = parseFrame(
				pending.subarray(bodyStart, bodyStart + length).toString("utf8"),
			);
			pending = pending.subarray(bodyStart + length);
			if (frame) onFrame(frame);
		}
	};
}
