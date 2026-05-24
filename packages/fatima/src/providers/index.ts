import { heroku } from "./heroku";
import { infisical } from "./infisical";
import { local } from "./local";
import { vercel } from "./vercel";

export const builtinProviders = {
	heroku,
	infisical,
	local,
	vercel,
};

export const providers = builtinProviders;
