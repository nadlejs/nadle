import Path from "node:path";

import { it, expect, describe } from "vitest";

import { computeAffectedTasks } from "../../src/core/engine/affected.js";

const ROOT = Path.resolve("/repo");
const PKG_A = Path.join(ROOT, "packages/a");
const PKG_B = Path.join(ROOT, "packages/b");
const PKG_C = Path.join(ROOT, "packages/c");

const workspaceDirs = new Map([
	["__ROOT__", ROOT],
	["a", PKG_A],
	["b", PKG_B],
	["c", PKG_C]
]);

// task id → workspace id
const taskWorkspace: Record<string, string> = {
	"a:build": "a",
	"b:build": "b",
	"c:build": "c",
	"__ROOT__:lint": "__ROOT__"
};

// task id → its transitive dependencies
const deps: Record<string, string[]> = {
	"a:build": [],
	"c:build": [],
	"__ROOT__:lint": [],
	"b:build": ["a:build"]
};

function run(changedFiles: string[]): Set<string> {
	return new Set(
		computeAffectedTasks({
			changedFiles,
			workspaceDirs,
			scheduledTasks: Object.keys(taskWorkspace),
			getWorkspaceId: (taskId) => taskWorkspace[taskId],
			getTransitiveDependencies: (taskId) => deps[taskId] ?? []
		})
	);
}

describe.concurrent("computeAffectedTasks", () => {
	it("includes a task whose own workspace changed", () => {
		expect(run([Path.join(PKG_A, "src/index.ts")])).toEqual(new Set(["a:build"]));
	});

	it("pulls in the dependencies a directly affected task needs", () => {
		// b:build's workspace changed and it depends on a:build; both must run so the
		// dependency produces b's inputs.
		expect(run([Path.join(PKG_B, "src/index.ts")])).toEqual(new Set(["b:build", "a:build"]));
	});

	it("does not include a clean dependent of a changed workspace", () => {
		// Only a changed. b depends on a but b's own workspace is clean, so b is not run
		// (workspace-locality model — cross-workspace dependent propagation is out of scope).
		expect(run([Path.join(PKG_A, "src/index.ts")])).toEqual(new Set(["a:build"]));
	});

	it("attributes a file to the most specific (nested) workspace", () => {
		// A file under packages/a belongs to 'a', not the root, so root-only tasks stay clean.
		expect(run([Path.join(PKG_A, "src/index.ts")]).has("__ROOT__:lint")).toBe(false);
	});

	it("treats a root-level change as dirtying the root workspace", () => {
		expect(run([Path.join(ROOT, "nadle.config.ts")])).toEqual(new Set(["__ROOT__:lint"]));
	});

	it("returns nothing when no files changed", () => {
		expect(run([])).toEqual(new Set());
	});

	it("includes only the changed workspace's task in a multi-package change", () => {
		expect(run([Path.join(PKG_C, "x.ts")])).toEqual(new Set(["c:build"]));
	});
});
