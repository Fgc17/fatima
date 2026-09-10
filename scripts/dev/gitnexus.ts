import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { delimiter, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");

const BLOCK = /\n*<!-- gitnexus:start -->[\s\S]*?<!-- gitnexus:end -->\n*/;
const STALE_HINT = /^> Index stale\?.*$/m;
const STALE_RUNNER =
	"> Index stale? Run `bun run gitnexus` from the project root.";

async function rewrite(file: string, edit: (source: string) => string) {
	const path = join(ROOT, file);
	const source = await readFile(path, "utf8");
	const next = edit(source);
	if (next !== source) await writeFile(path, next);
}

function pinnedVersion(config: unknown): string {
	const servers = Reflect.get(Object(config), "mcpServers");
	const args: unknown = Reflect.get(Object(servers), "gitnexus")?.args;
	if (!Array.isArray(args)) return "";
	return (
		args.find(
			(arg): arg is string =>
				typeof arg === "string" && arg.startsWith("gitnexus@"),
		) ?? ""
	);
}

function execute(command: string, args: string[]) {
	const { status } = spawnSync(command, args, {
		cwd: ROOT,
		env: {
			...process.env,
			PATH: [join(ROOT, "node_modules/.bin"), process.env.PATH]
				.filter(Boolean)
				.join(delimiter),
		},
		stdio: "inherit",
	});
	if (status !== 0) process.exit(status ?? 1);
}

const pinned = pinnedVersion(
	JSON.parse(await readFile(join(ROOT, ".agents/.mcp.json"), "utf8")),
);

if (pinned === "") {
	console.error(
		".agents/.mcp.json pins no gitnexus version for the MCP server.",
	);
	process.exit(1);
}

execute("npx", ["-y", pinned, "analyze", ...process.argv.slice(2)]);

await Promise.all([
	rewrite("CLAUDE.md", (source) => source.replace(BLOCK, "\n")),
	rewrite("AGENTS.md", (source) => source.replace(STALE_HINT, STALE_RUNNER)),
]);

execute("oxfmt", ["AGENTS.md", "CLAUDE.md"]);
