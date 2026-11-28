import ChildProcess from "node:child_process";

import { decideScope } from "./test-scope.js";

const DEFAULT_BASE = "origin/main";
const NARROWED_WHEN_FULL = ["kernel", "project-resolver", "eslint-plugin", "language-server", "create-nadle"];
const useShell = process.platform === "win32";

function run(command: string, args: string[]): ChildProcess.SpawnSyncReturns<string> {
	return ChildProcess.spawnSync(command, args, { shell: useShell, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
}

function git(...args: string[]): string {
	const result = run("git", args);

	if (result.status !== 0) {
		throw new Error(`git ${args.join(" ")} failed (exit ${result.status ?? result.error?.message})`);
	}

	return result.stdout.trim();
}

function lines(output: string): string[] {
	return output.split("\n").filter(Boolean);
}

function baseFromArgs(argv: string[]): string {
	const index = argv.indexOf("--base");

	return index === -1 ? DEFAULT_BASE : (argv[index + 1] ?? "");
}

function vitest(args: string[]): number {
	console.log(`> vp test run ${args.join(" ")}`);
	const result = ChildProcess.spawnSync("pnpm", ["exec", "vp", "test", "run", ...args], { shell: useShell, stdio: "inherit" });

	return result.status ?? 1;
}

function main(): number {
	const base = baseFromArgs(process.argv.slice(2));

	if (!base) {
		throw new Error("--base needs a git ref");
	}

	// Diffing from the merge base keeps commits that landed on the base after branching out of the scope.
	const mergeBase = git("merge-base", "HEAD", base);
	const changed = [...lines(git("diff", "--name-only", mergeBase)), ...lines(git("ls-files", "--others", "--exclude-standard"))];
	const scope = decideScope([...new Set(changed)]);

	console.log(`testChanged: base ${base} (${mergeBase.slice(0, 9)}), ${changed.length} changed files`);
	console.log(`testChanged: scope ${scope.kind}, ${scope.reason}`);

	if (scope.kind === "none") {
		console.log("testChanged: nothing to run. This is a local shortcut; CI always runs everything.");

		return 0;
	}

	const narrow = ["--changed", mergeBase, "--passWithNoTests"];

	if (scope.kind === "narrow") {
		return vitest(narrow);
	}

	const fullStatus = vitest(["--project", "nadle"]);
	const restStatus = vitest([...narrow, ...NARROWED_WHEN_FULL.flatMap((name) => ["--project", name])]);

	return fullStatus || restStatus;
}

try {
	process.exitCode = main();
} catch (error) {
	console.error(`testChanged failed: ${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 1;
}
