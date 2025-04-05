import type { AnyType } from "lib/utils/types";

const noEnvRuleObject = {
	meta: {
		type: "problem",
		docs: {
			description: "Prevents unsafe access of the 'env' object.",
			recommended: false,
		},
		schema: [],
		messages: {
			noEnv: "Access to the 'env' object is not allowed here.",
		},
	},

	create(context: AnyType) {
		return {
			MemberExpression(node: AnyType) {
				if (node.object && node.object.name === "env") {
					context.report({
						node,
						messageId: "noEnv",
					});
				}
			},

			CallExpression(node: AnyType) {
				if (node.callee?.object?.name === "env") {
					context.report({
						node,
						messageId: "noEnv",
					});
				}
			},
		};
	},
};

const noProcessEnvRule = {
	meta: {
		type: "problem",
		docs: {
			description: "Prevents unsafe access of the 'process.env' object.",
			recommended: false,
		},
		schema: [],
		messages: {
			noProcessEnv:
				"Access to the 'process.env' object is not allowed, use 'env' or 'publicEnv'.",
		},
	},

	create(context: AnyType) {
		return {
			MemberExpression(node: AnyType) {
				if (node.object?.name === "process" && node.property?.name === "env") {
					context.report({
						node,
						messageId: "noProcessEnv",
					});
				}
			},

			CallExpression(node: AnyType) {
				if (
					node.callee?.object?.name === "process" &&
					node.callee.property?.name === "env"
				) {
					context.report({
						node,
						messageId: "noProcessEnv",
					});
				}
			},
		};
	},
};

export const plugin = {
	plugins: {
		"@fatima": {
			rules: {
				"no-env": noEnvRuleObject,
				"no-process-env": noProcessEnvRule,
			},
		},
	},
	rules: {
		"@fatima/no-process-env": "error",
	},
} as const;

export const noEnvRule = (...files: string[]) =>
	({
		files,
		rules: {
			"@fatima/no-env": "error",
		},
	}) as const;
