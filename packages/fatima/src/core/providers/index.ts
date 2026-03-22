import { dotenv } from "./dotenv";
import { heroku } from "./heroku";
import { infisical } from "./infisical";
import { local } from "./local";
import { vercel } from "./vercel";

export const providers = {
	dotenv,
	heroku,
	infisical,
	local,
	vercel,
};
