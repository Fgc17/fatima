import { z } from "zod";
import type {
	FatimaModel,
	FatimaModelGeneratorSpec,
	FatimaModelValidator,
} from "../plugins/types";

function getFirstIssueMessage(result: z.ZodSafeParseResult<unknown>) {
	if (result.success) {
		return;
	}

	return result.error.issues[0]?.message ?? "Invalid value";
}

function createValidator(schema: z.ZodType<unknown>): FatimaModelValidator {
	return (value) => getFirstIssueMessage(schema.safeParse(value));
}

function createBuiltinGeneratorSpec(
	type: string,
	wrap: string,
): Record<string, FatimaModelGeneratorSpec> {
	return {
		typescript: { type, wrap },
		javascript: { wrap },
		python: { wrap },
	};
}

const validateEmail = createValidator(z.email());
const validateUrl = createValidator(z.url());
const validateUuid = createValidator(z.uuid());
const validateNumber = createValidator(
	z.string().trim().min(1, "Expected a number").pipe(z.coerce.number()),
);
const validateInteger = createValidator(
	z
		.string()
		.trim()
		.min(1, "Expected an integer")
		.pipe(z.coerce.number())
		.pipe(z.int({ error: "Expected an integer" })),
);
const validateBoolean = createValidator(z.stringbool());
const validateString = createValidator(z.string());
const validateNonempty = createValidator(
	z.string().trim().min(1, "Expected a non-empty value"),
);
const validateJson = createValidator(
	z.string().transform((input, ctx) => {
		try {
			return JSON.parse(input);
		} catch {
			ctx.issues.push({
				code: "custom",
				message: "Expected valid JSON",
				input,
			});
			return z.NEVER;
		}
	}),
);
const validatePem = createValidator(
	z
		.string()
		.regex(/-----BEGIN [A-Z0-9 ]+-----[\s\S]+-----END [A-Z0-9 ]+-----/, {
			message: "Expected a valid PEM value",
		}),
);
const validateSk = createValidator(
	z.string().regex(/^sk[-_][A-Za-z0-9._-]+$/, {
		message: "Expected a valid sk secret",
	}),
);
const validateBearer = createValidator(
	z.string().regex(/^Bearer\s+.+$/, {
		message: "Expected a valid bearer token",
	}),
);

function createModel(
	validate: FatimaModelValidator,
	type: string,
	wrap: string,
): FatimaModel {
	return {
		validate,
		generators: createBuiltinGeneratorSpec(type, wrap),
	};
}

export const builtinModels: Record<string, FatimaModel> = {
	string: createModel(validateString, "string", "__fatimaString($1, $key)"),
	nonempty: createModel(
		validateNonempty,
		"string",
		"__fatimaNonempty($1, $key)",
	),
	email: createModel(validateEmail, "string", "__fatimaEmail($1, $key)"),
	url: createModel(validateUrl, "string", "__fatimaUrl($1, $key)"),
	uuid: createModel(validateUuid, "string", "__fatimaUuid($1, $key)"),
	number: createModel(validateNumber, "number", "__fatimaNumber($1, $key)"),
	integer: createModel(validateInteger, "number", "__fatimaInteger($1, $key)"),
	boolean: createModel(validateBoolean, "boolean", "__fatimaBoolean($1, $key)"),
	json: createModel(validateJson, "unknown", "__fatimaJson($1, $key)"),
	pem: createModel(validatePem, "string", "__fatimaPem($1, $key)"),
	sk: createModel(validateSk, "string", "__fatimaSk($1, $key)"),
	bearer: createModel(validateBearer, "string", "__fatimaBearer($1, $key)"),
};
