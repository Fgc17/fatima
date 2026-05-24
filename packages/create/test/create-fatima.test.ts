import * as fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { create } from "../src/create-fatima";
import { checkPackageJson } from "../src/utils/check-package-json";
import {
	cleanEphemeralFolder,
	openEphemeralFolder,
} from "./utils/ephemeral-folder";

describe("create-fatima", () => {
	const projectDir = process.cwd();
	let ephemeralFolder: string;

	beforeEach(async () => {
		ephemeralFolder = await openEphemeralFolder();

		await fs.writeFile(
			"package.json",
			JSON.stringify({ name: "temp-project", version: "1.0.0" }, null, 2),
		);
	});

	afterEach(async () => {
		await cleanEphemeralFolder(ephemeralFolder, projectDir);
	});

	it("creates a JavaScript config and local project tweaks", async () => {
		const result = await create({
			generator: "javascript",
			adapter: "local",
			validator: "custom",
		});

		expect(result).toEqual({
			dependencies: ["fatima"],
			outputFile: "fatima.json",
		});

		const configFile = await fs.readFile("fatima.json", "utf8");
		const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));
		const jsConfig = JSON.parse(await fs.readFile("jsconfig.json", "utf8"));
		const gitignore = await fs.readFile(".gitignore", "utf8");

		expect(configFile).toContain('"generator": "javascript"');
		expect(configFile).toContain('"providers"');
		expect(configFile).toContain('"provider": "local"');
		expect(configFile).toContain('"model"');
		expect(configFile).toContain('"NODE_ENV": "nonempty"');
		expect(packageJson.imports).toEqual({ "#env": "./env.js" });
		expect(jsConfig.compilerOptions.baseUrl).toBe(".");
		expect(jsConfig.compilerOptions.paths["#env"]).toEqual(["./env.js"]);
		expect(gitignore).toContain("env.js");
	});

	it("creates a TypeScript config with built-in validators", async () => {
		const result = await create({
			generator: "typescript",
			adapter: "infisical",
			validator: "builtin",
		});

		expect(result.dependencies).toEqual(["fatima", "@infisical/sdk"]);

		const configFile = await fs.readFile("fatima.json", "utf8");
		const tsConfig = JSON.parse(await fs.readFile("tsconfig.json", "utf8"));
		const gitignore = await fs.readFile(".gitignore", "utf8");

		expect(configFile).toContain('"generator": "typescript"');
		expect(configFile).toContain('"providers"');
		expect(configFile).toContain('"provider": "infisical"');
		expect(configFile).toContain('"model"');
		expect(configFile).toContain('"type": "enum"');
		expect(tsConfig.compilerOptions.baseUrl).toBe(".");
		expect(tsConfig.compilerOptions.paths.env).toEqual(["./env.ts"]);
		expect(gitignore).toContain("env.ts");
	});
});

describe("checkPackageJson", () => {
	const projectDir = process.cwd();
	let ephemeralFolder: string;

	beforeEach(async () => {
		ephemeralFolder = await openEphemeralFolder();
	});

	afterEach(async () => {
		await cleanEphemeralFolder(ephemeralFolder, projectDir);
	});

	it("throws when package.json is missing", () => {
		expect(checkPackageJson).toThrowError(
			"'fatima init' must be executed in a directory with a package.json file.",
		);
	});
});
