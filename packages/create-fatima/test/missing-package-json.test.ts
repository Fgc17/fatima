import { describe, beforeEach, afterEach, test } from "vitest";
import {
	cleanEphemeralFolder,
	openEphemeralFolder,
} from "./utils/ephemeral-folder";
import { checkPackageJson } from "@/utils/check-package-json";

describe("Missing package.json", () => {
	const projectDir = process.cwd();
	let ephemeralFolder: string;

	beforeEach(async () => {
		ephemeralFolder = await openEphemeralFolder();
	});

	afterEach(async () => {
		await cleanEphemeralFolder(ephemeralFolder, projectDir);
	});

	test("should throw an error if package.json is missing", async ({
		expect,
	}) => {
		expect(checkPackageJson).toThrowError();
	});
});
