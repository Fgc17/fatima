import type { Any } from "../lib/types";

const noProcessEnvRuleObject = {
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

	create(context: Any) {
		return {
			MemberExpression(node: Any) {
				if (node.object?.name === "process" && node.property?.name === "env") {
					context.report({
						node,
						messageId: "noProcessEnv",
					});
				}
			},

			CallExpression(node: Any) {
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
				"no-process-env": noProcessEnvRuleObject,
			},
		},
	},
} as const;

export const noProcessEnvRule = (...files: string[]) =>
	({
		files,
		rules: {
			"@fatima/no-process-env": "error",
		},
	}) as const;
