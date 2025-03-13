import { describe, it, beforeEach, afterEach, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { create } from "src/create-fatima";
import type { Adapter } from "@/wizard/prompts/adapter";
import type { Language } from "@/wizard/prompts/language";
import type { Validator } from "@/wizard/prompts/validator";
import {
	cleanEphemeralFolder,
	openEphemeralFolder,
} from "./utils/ephemeral-folder";

describe("install modules", () => {
	const projectDir = process.cwd();
	let ephemeralFolder: string;

	beforeEach(async () => {
		ephemeralFolder = await openEphemeralFolder();

		const pkgJson = {
			name: "temp-project",
			version: "1.0.0",
		};

		await fs.writeFile("package.json", JSON.stringify(pkgJson, null, 2));
	});

	afterEach(async () => {
		await cleanEphemeralFolder(ephemeralFolder, projectDir);
	});

	it("should install modules correctly", async () => {
		const dummyLanguage = "javascript" as Language;
		const dummyAdapter = "custom" as Adapter;
		const dummyValidator = "custom" as Validator;

		const modules = await create({
			adapter: dummyAdapter,
			language: dummyLanguage,
			validator: dummyValidator,
		});

		expect(Array.isArray(modules)).toBe(true);

		const pkgData = await fs.readFile("package.json", "utf-8");

		const pkg = JSON.parse(pkgData);

		expect(pkg).toHaveProperty("dependencies");
		expect(pkg.dependencies).toHaveProperty("fatima");

		await fs.access("fatima.config.js");
	});
});
