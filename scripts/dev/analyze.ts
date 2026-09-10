import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { delimiter, dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const ROOT = resolve(import.meta.dirname, "../..");

type Check = { args: string[]; command: string };

type Lane = {
	checks: Check[];
	marker: string;
	source: RegExp;
};

const LANES: Lane[] = [
	{
		checks: [
			{
				args: [
					"clippy",
					"--workspace",
					"--all-targets",
					"--",
					"-D",
					"warnings",
				],
				command: "cargo",
			},
			{ args: ["test", "--workspace"], command: "cargo" },
		],
		marker: join(ROOT, ".tmp/agent-edits-rust"),
		source: /\.rs$/,
	},
	{
		checks: [
			{ args: [], command: "oxlint" },
			{ args: ["run", "analyze"], command: "bun" },
			{ args: ["run", "checktypes"], command: "bun" },
		],
		marker: join(ROOT, ".tmp/agent-edits-ts"),
		source: /\.(?:astro|cts|mts|tsx?)$/,
	},
];

type Payload = {
	hook_event_name: string;
	stop_hook_active?: boolean;
	tool_input?: { file_path?: string };
};

function isPayload(value: unknown): value is Payload {
	if (typeof value !== "object" || value === null) return false;
	return typeof Reflect.get(value, "hook_event_name") === "string";
}

async function readPayload(): Promise<Payload> {
	const parsed: unknown = await Bun.stdin.json();
	if (!isPayload(parsed)) throw new Error("analyze: unrecognised hook payload");
	return parsed;
}

async function mark(path: string) {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, "");
}

type Failure = { label: string; output: string };

async function check({ args, command }: Check): Promise<Failure | null> {
	const label = [command, ...args].join(" ");
	try {
		await run(command, args, {
			cwd: ROOT,
			env: {
				...process.env,
				PATH: [join(ROOT, "node_modules/.bin"), process.env.PATH]
					.filter(Boolean)
					.join(delimiter),
			},
		});
		return null;
	} catch (error) {
		if (Reflect.get(Object(error), "code") === "ENOENT") {
			console.error(`analyze: skipped ${label} — ${command} is not installed`);
			return null;
		}
		const stdout = String(Reflect.get(Object(error), "stdout") ?? "");
		const stderr = String(Reflect.get(Object(error), "stderr") ?? "");
		return { label, output: `${stdout}\n${stderr}`.trim() };
	}
}

const payload = await readPayload();

if (payload.hook_event_name === "PostToolUse") {
	const edited = payload.tool_input?.file_path ?? "";
	await Promise.all(
		LANES.filter((lane) => lane.source.test(edited)).map((lane) =>
			mark(lane.marker),
		),
	);
	process.exit(0);
}

if (payload.stop_hook_active === true) process.exit(0);

const dirty = LANES.filter((lane) => existsSync(lane.marker));

if (dirty.length === 0) process.exit(0);

await Promise.all(dirty.map((lane) => rm(lane.marker)));

const results = await Promise.all(
	dirty.flatMap((lane) => lane.checks).map(check),
);

const failed = results.filter((result) => result !== null);

if (failed.length === 0) process.exit(0);

for (const { label, output } of failed) console.error(`${label}\n${output}`);

process.exit(2);
