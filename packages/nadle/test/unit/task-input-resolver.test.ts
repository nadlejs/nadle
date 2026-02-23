import { type Project } from "@nadle/project";
import { type Logger } from "src/core/index.js";
import { it, vi, expect, describe } from "vitest";
import { ResolvedTask } from "src/core/interfaces/resolved-task.js";
import { TaskInputResolver } from "src/core/options/task-input-resolver.js";

const defaultLogger: Logger = {
	log: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
	error: vi.fn(),
	getColumns: vi.fn(),
	throw: (message: string) => {
		vi.fn();
		throw new Error(message);
	}
};

const emptyPackageJson = { name: "", version: "" };

const project: Project = {
	packageManager: "",
	currentWorkspaceId: "frontend",
	rootWorkspace: {
		label: "",
		id: "root",
		relativePath: "",
		dependencies: [],
		configFilePath: "",
		absolutePath: "/path/to/root",
		packageJson: emptyPackageJson
	},
	workspaces: [
		{
			id: "frontend",
			relativePath: "",
			dependencies: [],
			label: "frontend",
			configFilePath: null,
			packageJson: emptyPackageJson,
			absolutePath: "/path/to/frontend"
		},
		{
			id: "backend",
			label: "backend",
			relativePath: "",
			dependencies: [],
			configFilePath: null,
			packageJson: emptyPackageJson,
			absolutePath: "/path/to/backend"
		}
	]
};

const TasksByWorkspace = {
	root: ["build", "deploy", "lint"],

	backend: ["build", "test"],
	frontend: ["build", "clean", "prepare", "dev", "test"]
};

describe.concurrent("TaskInputResolver", () => {
	const resolver = new TaskInputResolver(defaultLogger, (ws: string) => TasksByWorkspace[ws as "backend" | "root" | "frontend"]);

	it("resolves exact task names in target workspace", () => {
		expect(resolver.resolve(["build"], project).map(ResolvedTask.getId)).toEqual(["frontend:build"]);
		expect(resolver.resolve(["backend:build"], project).map(ResolvedTask.getId)).toEqual(["backend:build"]);
		expect(resolver.resolve(["root:build"], project).map(ResolvedTask.getId)).toEqual(["root:build"]);
	});

	it("throws when task not found in target workspace", () => {
		expect(() => resolver.resolve(["release"], project)).toThrowPlainMessage("Task release not found in frontend nor root workspace.");
	});

	it("resolves task from fallback workspace if not found in target", () => {
		expect(resolver.resolve(["deploy"], project).map(ResolvedTask.getId)).toEqual(["root:deploy"]);
	});

	it("suggests correct task name for typos in target workspace", () => {
		expect(resolver.resolve(["biuld"], project).map(ResolvedTask.getId)).toEqual(["frontend:build"]);
		expect(resolver.resolve(["backend:biuld"], project).map(ResolvedTask.getId)).toEqual(["backend:build"]);
		expect(resolver.resolve(["root:biuld"], project).map(ResolvedTask.getId)).toEqual(["root:build"]);
	});

	it("suggests correct task name for typos from fallback workspace", () => {
		expect(resolver.resolve(["deplyo"], project).map(ResolvedTask.getId)).toEqual(["root:deploy"]);
	});

	it("suggests correct workspace name for typos", () => {
		expect(resolver.resolve(["fronte:build"], project).map(ResolvedTask.getId)).toEqual(["frontend:build"]);
		expect(resolver.resolve(["backe:build"], project).map(ResolvedTask.getId)).toEqual(["backend:build"]);
	});

	it("throws when workspace not found", () => {
		expect(() => resolver.resolve(["unknown:build"], project)).toThrowPlainMessage("Workspace unknown not found.");
	});

	it("suggests correct task and workspace name for typos", () => {
		expect(resolver.resolve(["backe:biuld"], project).map(ResolvedTask.getId)).toEqual(["backend:build"]);
	});
});
