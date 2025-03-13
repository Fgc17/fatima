const { execSync } = require("child_process");

const args = process.argv.slice(2);
const command = args[0];
const toolArgIndex = args.findIndex((arg) => arg === "--tool" || arg === "-t");
const langArgIndex = args.findIndex((arg) => arg === "--lang" || arg === "-l");

if (!command || toolArgIndex === -1 || toolArgIndex + 1 >= args.length) {
	console.error("Error: command and --tool/-t argument are required");
	process.exit(1);
}

const tool = args[toolArgIndex + 1];
const lang = args[langArgIndex + 1]  || "ts"
const fullCommand = `fatima ${command} --config ./src/${tool}/env.config.${lang}`;

try {
	execSync(fullCommand, { stdio: "inherit" });
} catch {
	process.exit(1);
}
