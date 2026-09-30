import Path from "node:path";
import Util from "node:util";
import ChildProcess from "node:child_process";

import { ConfigurationError } from "../utilities/nadle-error.js";

const execFile = Util.promisify(ChildProcess.execFile);

/**
 * Files changed since `ref`, as absolute paths. Runs `git diff --name-only <ref>`
 * from the repository root so the returned paths are stable regardless of cwd.
 * Throws a ConfigurationError if git is unavailable, the directory is not a repo,
 * or the ref is invalid.
 */
export async function getChangedFiles(ref: string, cwd: string): Promise<string[]> {
	let repoRoot: string;

	try {
		const { stdout } = await execFile("git", ["rev-parse", "--show-toplevel"], { cwd });
		repoRoot = stdout.trim();
	} catch (error) {
		throw new ConfigurationError(`Cannot determine the git repository for --since: ${gitErrorMessage(error)}`);
	}

	try {
		const { stdout } = await execFile("git", ["diff", "--name-only", ref], { cwd: repoRoot });

		return stdout
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean)
			.map((relative) => Path.resolve(repoRoot, relative));
	} catch (error) {
		throw new ConfigurationError(`git diff against "${ref}" failed: ${gitErrorMessage(error)}`);
	}
}

function gitErrorMessage(error: unknown): string {
	if (error && typeof error === "object" && "stderr" in error && typeof error.stderr === "string" && error.stderr.trim()) {
		return error.stderr.trim();
	}

	return error instanceof Error ? error.message : String(error);
}

interface AffectedInput {
	/** Absolute paths of files changed since the ref. */
	readonly changedFiles: readonly string[];
	/** Every task id in the scheduled graph (the requested roots, expanded, plus their dependencies). */
	readonly scheduledTasks: readonly string[];
	/** Absolute directory of each workspace; most-specific match wins (computed internally). */
	readonly workspaceDirs: ReadonlyMap<string, string>;
	/** Workspace id a task belongs to. */
	readonly getWorkspaceId: (taskId: string) => string;
	/** Transitive dependency task ids of a task (excluding itself). */
	readonly getTransitiveDependencies: (taskId: string) => Iterable<string>;
}

/**
 * From the full scheduled graph, return the task ids that should run because a
 * changed file lies within their workspace directory ("directly affected"), together
 * with the dependencies those tasks need. A task with no dirty workspace runs only
 * when something downstream of it is affected — i.e. it is a dependency of a directly
 * affected task. Pure — all project and scheduler lookups are injected.
 */
export function computeAffectedTasks(input: AffectedInput): string[] {
	const { changedFiles, scheduledTasks, getWorkspaceId, getTransitiveDependencies } = input;

	const dirtyWorkspaces = dirtyWorkspaceIds(changedFiles, input.workspaceDirs);

	if (dirtyWorkspaces.size === 0) {
		return [];
	}

	const toRun = new Set<string>();

	for (const taskId of scheduledTasks) {
		if (dirtyWorkspaces.has(getWorkspaceId(taskId))) {
			toRun.add(taskId);

			// A directly affected task still needs its dependencies to produce its inputs.
			for (const dep of getTransitiveDependencies(taskId)) {
				toRun.add(dep);
			}
		}
	}

	return [...toRun];
}

function dirtyWorkspaceIds(changedFiles: readonly string[], workspaceDirs: ReadonlyMap<string, string>): Set<string> {
	// Most specific (longest path) first so a file in a nested package attributes to
	// that package, not its ancestor root workspace.
	const entries = [...workspaceDirs.entries()].sort(([, a], [, b]) => b.length - a.length);
	const dirty = new Set<string>();

	for (const file of changedFiles) {
		for (const [workspaceId, dir] of entries) {
			if (isWithin(dir, file)) {
				dirty.add(workspaceId);
				break;
			}
		}
	}

	return dirty;
}

function isWithin(dir: string, file: string): boolean {
	const relative = Path.relative(dir, file);

	return relative === "" || (!relative.startsWith("..") && !Path.isAbsolute(relative));
}
