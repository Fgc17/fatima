import { dotenv } from "./dotenv";
import { heroku } from "./heroku";
import { infisical } from "./infisical";
import { local } from "./local";
import { triggerDev } from "./trigger-dev";
import { vercel } from "./vercel";

export const adapters = {
	infisical,
	triggerDev,
	vercel,
	dotenv,
	heroku,
	local,
};
