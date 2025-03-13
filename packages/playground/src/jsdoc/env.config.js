const { config, adapters, validators } = require("fatima");
const { z } = require("zod");

const dotenv = require("dotenv");

/**
 * @type {import('#jsdoc-env').Constraint}
 */
const constraint = {
	NODE_ENV: z.string(),
	TZ: z.string(),
	NEXT_PUBLIC_API_URL: z.string(),
};

module.exports = config({
	load: {
		development: [adapters.dotenv.load(dotenv)],
	},
	validate: validators.zod(z.object(constraint)),
	environment: () => process.env.NODE_ENV ?? "development",
	client: {
		publicPrefix: "PUBLIC_"
	}
});
