import type { PathLike } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_EPHEMERAL_DIR = path.join(os.tmpdir(), "EPHEMERAL");

async function ensureBaseEphemeralDir() {
	try {
		await fs.access(BASE_EPHEMERAL_DIR);
	} catch {
		await fs.mkdir(BASE_EPHEMERAL_DIR, { recursive: true });
	}
}

export async function getTempEphemeralFolder() {
	await ensureBaseEphemeralDir();

	const uniqueDir = path.join(BASE_EPHEMERAL_DIR, crypto.randomUUID());

	try {
		await fs.mkdir(uniqueDir);
	} catch (err) {
		console.error("Error creating unique EPHEMERAL directory:", err);
	}

	return uniqueDir;
}

export async function openEphemeralFolder() {
	await ensureBaseEphemeralDir();

	const ephemeralDir = await getTempEphemeralFolder();

	process.chdir(ephemeralDir);

	return ephemeralDir;
}

export async function cleanEphemeralFolder(
	tempDir: PathLike,
	originalCwd: string,
) {
	try {
		process.chdir(originalCwd);
		await fs.rm(tempDir, { recursive: true, force: true });
	} catch (err) {
		console.error("Error cleaning up temporary ephemeral directory:", err);
	}
}
