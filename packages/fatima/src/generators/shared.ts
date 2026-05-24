import path from "node:path";
import { FatimaError } from "../lib/error";
import type { FatimaGeneratorContext } from "../plugins/types";

export type ResolvedModelSpec = {
	key: string;
	type: string;
	imports: string[];
	expression: string;
};

function getModelConfigType(value: unknown) {
	return typeof value === "string"
		? value
		: value &&
			  typeof value === "object" &&
			  typeof (value as { type?: unknown }).type === "string"
			? (value as { type: string }).type
			: undefined;
}

function replaceTemplate(template: string, params: Record<string, string>): string {
	return Object.entries(params).reduce(
		(result, [key, value]) => result.replaceAll(key, value),
		template,
	);
}

function getEnumValues(config: unknown) {
	const values =
		config && typeof config === "object"
			? (config as { values?: unknown }).values
			: undefined;

	if (!Array.isArray(values) || !values.every((item) => typeof item === "string")) {
		throw new FatimaError(
			"Model `enum` requires a non-empty string array in `values`.",
		);
	}

	return values;
}

export function resolveModelSpecs(
	context: FatimaGeneratorContext,
	keys: string[],
	params: {
		rawValueExpression: (key: string) => string;
		defaultType: string;
	},
): ResolvedModelSpec[] {
	return keys.map((key) => {
		const modelConfig = context.model?.[key];
		const modelName = getModelConfigType(modelConfig);

		if (!modelName) {
			return {
				key,
				type: params.defaultType,
				imports: [],
				expression: params.rawValueExpression(key),
			};
		}

		const model = context.registry.models[modelName];

		if (!model) {
			throw new FatimaError(`Unknown Fatima model: ${modelName}`);
		}

		const generatorSpec = model.generators[context.generator];

		if (!generatorSpec) {
			throw new FatimaError(
				`Model ${modelName} does not support generator ${context.generator}.`,
			);
		}

		const values =
			modelName === "enum" ? JSON.stringify(getEnumValues(modelConfig)) : "undefined";
		const expression = replaceTemplate(generatorSpec.wrap, {
			"$1": params.rawValueExpression(key),
			"$key": JSON.stringify(key),
			"$values": values,
		});

		return {
			key,
			type: generatorSpec.type ?? params.defaultType,
			imports: generatorSpec.imports ?? [],
			expression,
		};
	});
}

export function getPublicKeys(keys: string[], publicPrefix?: string) {
	if (!publicPrefix) {
		return [];
	}

	return keys.filter((key) => key.startsWith(publicPrefix));
}

export function getPrivateKeys(keys: string[], publicPrefix?: string) {
	if (!publicPrefix) {
		return keys;
	}

	return keys.filter((key) => !key.startsWith(publicPrefix));
}

export function getSiblingPublicPath(filePath: string) {
	const extension = path.extname(filePath);
	const basename = path.basename(filePath, extension);
	const dirname = path.dirname(filePath);
	return path.join(dirname, `${basename}.public${extension}`);
}

export function renderBuiltinHelpers(language: "typescript" | "javascript") {
	const typed = (js: string, ts: string) =>
		language === "typescript" ? ts : js;

	return [
		typed(
			"function __fatimaRequireString(value, key) {",
			"function __fatimaRequireString(value: unknown, key: string): string {",
		),
		"\tif (typeof value !== \"string\") {",
		"\t\tthrow new Error(`Missing environment variable: ${key}`);",
		"\t}",
		"",
		"\treturn value;",
		"}",
		"",
		typed(
			"function __fatimaString(value, key) {",
			"function __fatimaString(value: unknown, key: string): string {",
		),
		"\treturn __fatimaRequireString(value, key);",
		"}",
		"",
		typed(
			"function __fatimaNonempty(value, key) {",
			"function __fatimaNonempty(value: unknown, key: string): string {",
		),
		"\tconst nextValue = __fatimaRequireString(value, key);",
		"\tif (nextValue.trim().length === 0) {",
		"\t\tthrow new Error(`Expected a non-empty value for ${key}`);",
		"\t}",
		"\treturn nextValue;",
		"}",
		"",
		typed(
			"function __fatimaEmail(value, key) {",
			"function __fatimaEmail(value: unknown, key: string): string {",
		),
		"\tconst nextValue = __fatimaRequireString(value, key);",
		"\tif (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(nextValue)) {",
		"\t\tthrow new Error(`Expected a valid email for ${key}`);",
		"\t}",
		"\treturn nextValue;",
		"}",
		"",
		typed(
			"function __fatimaUrl(value, key) {",
			"function __fatimaUrl(value: unknown, key: string): string {",
		),
		"\tconst nextValue = __fatimaRequireString(value, key);",
		"\ttry {",
		"\t\tnew URL(nextValue);",
		"\t} catch {",
		"\t\tthrow new Error(`Expected a valid URL for ${key}`);",
		"\t}",
		"\treturn nextValue;",
		"}",
		"",
		typed(
			"function __fatimaUuid(value, key) {",
			"function __fatimaUuid(value: unknown, key: string): string {",
		),
		"\tconst nextValue = __fatimaRequireString(value, key);",
		"\tif (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(nextValue)) {",
		"\t\tthrow new Error(`Expected a valid UUID for ${key}`);",
		"\t}",
		"\treturn nextValue;",
		"}",
		"",
		typed(
			"function __fatimaNumber(value, key) {",
			"function __fatimaNumber(value: unknown, key: string): number {",
		),
		"\tconst nextValue = __fatimaRequireString(value, key);",
		"\tconst parsed = Number(nextValue);",
		"\tif (Number.isNaN(parsed)) {",
		"\t\tthrow new Error(`Expected a number for ${key}`);",
		"\t}",
		"\treturn parsed;",
		"}",
		"",
		typed(
			"function __fatimaInteger(value, key) {",
			"function __fatimaInteger(value: unknown, key: string): number {",
		),
		"\tconst parsed = __fatimaNumber(value, key);",
		"\tif (!Number.isInteger(parsed)) {",
		"\t\tthrow new Error(`Expected an integer for ${key}`);",
		"\t}",
		"\treturn parsed;",
		"}",
		"",
		typed(
			"function __fatimaBoolean(value, key) {",
			"function __fatimaBoolean(value: unknown, key: string): boolean {",
		),
		"\tconst nextValue = __fatimaRequireString(value, key).toLowerCase();",
		"\tif ([\"true\", \"1\", \"yes\", \"on\", \"y\", \"enabled\"].includes(nextValue)) {",
		"\t\treturn true;",
		"\t}",
		"\tif ([\"false\", \"0\", \"no\", \"off\", \"n\", \"disabled\"].includes(nextValue)) {",
		"\t\treturn false;",
		"\t}",
		"\tthrow new Error(`Expected a boolean for ${key}`);",
		"}",
		"",
		typed(
			"function __fatimaJson(value, key) {",
			"function __fatimaJson(value: unknown, key: string): unknown {",
		),
		"\tconst nextValue = __fatimaRequireString(value, key);",
		"\ttry {",
		"\t\treturn JSON.parse(nextValue);",
		"\t} catch {",
		"\t\tthrow new Error(`Expected valid JSON for ${key}`);",
		"\t}",
		"}",
		"",
		typed(
			"function __fatimaEnum(value, key, values) {",
			"function __fatimaEnum(value: unknown, key: string, values: string[]): string {",
		),
		"\tconst nextValue = __fatimaRequireString(value, key);",
		"\tif (!values.includes(nextValue)) {",
		"\t\tthrow new Error(`Expected one of ${values.join(\", \")} for ${key}`);",
		"\t}",
		"\treturn nextValue;",
		"}",
		"",
		typed(
			"function __fatimaPem(value, key) {",
			"function __fatimaPem(value: unknown, key: string): string {",
		),
		"\tconst nextValue = __fatimaRequireString(value, key);",
		"\tif (!/-----BEGIN [A-Z0-9 ]+-----[\\s\\S]+-----END [A-Z0-9 ]+-----/.test(nextValue)) {",
		"\t\tthrow new Error(`Expected a valid PEM value for ${key}`);",
		"\t}",
		"\treturn nextValue;",
		"}",
		"",
		typed(
			"function __fatimaSk(value, key) {",
			"function __fatimaSk(value: unknown, key: string): string {",
		),
		"\tconst nextValue = __fatimaRequireString(value, key);",
		"\tif (!/^sk[-_][A-Za-z0-9._-]+$/.test(nextValue)) {",
		"\t\tthrow new Error(`Expected a valid sk secret for ${key}`);",
		"\t}",
		"\treturn nextValue;",
		"}",
		"",
		typed(
			"function __fatimaBearer(value, key) {",
			"function __fatimaBearer(value: unknown, key: string): string {",
		),
		"\tconst nextValue = __fatimaRequireString(value, key);",
		"\tif (!/^Bearer\\s+.+$/.test(nextValue)) {",
		"\t\tthrow new Error(`Expected a valid bearer token for ${key}`);",
		"\t}",
		"\treturn nextValue;",
		"}",
	].join("\n");
}
