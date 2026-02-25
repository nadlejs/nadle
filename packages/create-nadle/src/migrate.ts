import type { ScriptEntry, NadleTaskType, PackageManager, ScriptCategory } from "./types.js";

const LONG_RUNNING_NAMES = new Set(["start", "dev", "serve", "watch", "preview"]);

/* cspell:disable */
const LIFECYCLE_SCRIPTS = new Set([
	"preinstall",
	"install",
	"postinstall",
	"prepublish",
	"prepare",
	"prepublishOnly",
	"prepack",
	"postpack",
	"publish",
	"postpublish",
	"preversion",
	"version",
	"postversion",
	"preuninstall",
	"uninstall",
	"postuninstall",
	"dependencies"
]);
/* cspell:enable */

const LONG_RUNNING_SUFFIXES = [":watch", ":dev", ":serve"];

const CROSS_ENV_PATTERN = /^cross-env\s+/;
const ENV_VAR_PATTERN = /^[A-Z_][A-Z0-9_]*=/;

export function classifyScript(name: string, allScriptNames: Set<string>): ScriptCategory {
	if (LIFECYCLE_SCRIPTS.has(name)) {
		return "lifecycle";
	}

	if (name.startsWith("pre")) {
		const base = name.slice(3);

		if (allScriptNames.has(base)) {
			return "pre-post";
		}
	}

	if (name.startsWith("post")) {
		const base = name.slice(4);

		if (allScriptNames.has(base)) {
			return "pre-post";
		}
	}

	if (isLongRunning(name)) {
		return "long-running";
	}

	return "task";
}

function isLongRunning(name: string): boolean {
	if (LONG_RUNNING_NAMES.has(name)) {
		return true;
	}

	return LONG_RUNNING_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

export function transformTaskName(name: string): string {
	return name
		.toLowerCase()
		.replaceAll(/[:._]/g, "-")
		.replaceAll(/^-+|-+$/g, "");
}

export function detectTaskType(command: string, _pm: PackageManager): NadleTaskType {
	const { cmd: trimmed } = extractCrossEnv(command);

	if (trimmed.startsWith("node ")) {
		return "NodeTask";
	}

	if (trimmed.startsWith("rimraf ") || trimmed.startsWith("rm -rf ")) {
		return "DeleteTask";
	}

	if (trimmed.startsWith("npx ")) {
		return "NpxTask";
	}

	if (trimmed.startsWith("pnpx ") || trimmed.startsWith("pnpm exec ")) {
		return "PnpxTask";
	}

	if (trimmed.startsWith("pnpm ")) {
		return "PnpmTask";
	}

	if (trimmed.startsWith("npm ")) {
		return "NpmTask";
	}

	return "ExecTask";
}

function extractCrossEnv(command: string): { cmd: string; envVars: Record<string, string> } {
	let result = command.trim();
	const envVars: Record<string, string> = {};

	while (CROSS_ENV_PATTERN.test(result)) {
		result = result.replace(CROSS_ENV_PATTERN, "");

		while (ENV_VAR_PATTERN.test(result)) {
			const match = result.match(/^([A-Z_][A-Z0-9_]*)=(\S*)\s*/);

			if (!match) {
				break;
			}

			envVars[match[1]] = match[2];
			result = result.slice(match[0].length);
		}
	}

	return { envVars, cmd: result };
}

export function parseCommand(command: string): { cmd: string; args: string[]; envVars: Record<string, string> } {
	const { envVars, cmd: stripped } = extractCrossEnv(command);
	const tokens = stripped.split(/\s+/).filter(Boolean);
	const cmd = tokens[0] ?? "";
	const args = tokens.slice(1);

	return { cmd, args, envVars };
}

function resolvePrePostDeps(entries: ScriptEntry[]): void {
	const byName = new Map(entries.map((e) => [e.name, e]));

	for (const entry of entries) {
		if (entry.category !== "pre-post") {
			continue;
		}

		if (entry.name.startsWith("pre")) {
			const base = byName.get(entry.name.slice(3));

			if (base) {
				base.dependsOn.push(entry.nadleTaskName);
			}
		}
	}
}

function resolveNameCollisions(entries: ScriptEntry[]): void {
	const seen = new Map<string, number>();

	for (const entry of entries) {
		const count = seen.get(entry.nadleTaskName) ?? 0;

		if (count > 0) {
			entry.nadleTaskName = `${entry.nadleTaskName}-${count + 1}`;
		}

		seen.set(entry.nadleTaskName, count + 1);
	}
}

export function parseScripts(scripts: Record<string, string>, pm: PackageManager): ScriptEntry[] {
	const allNames = new Set(Object.keys(scripts));
	const entries: ScriptEntry[] = [];

	for (const [name, command] of Object.entries(scripts)) {
		const { cmd, args, envVars } = parseCommand(command);

		entries.push({
			name,
			command,
			envVars,
			dependsOn: [],
			parsedArgs: args,
			parsedCommand: cmd,
			taskType: detectTaskType(command, pm),
			nadleTaskName: transformTaskName(name),
			category: classifyScript(name, allNames)
		});
	}

	resolvePrePostDeps(entries);
	resolveNameCollisions(entries);

	return entries;
}
