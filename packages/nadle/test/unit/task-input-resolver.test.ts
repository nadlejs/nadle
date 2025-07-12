import { type Logger } from "src/core/index.js";
import { it, vi, expect, describe } from "vitest";

import { type Project } from "../../src/core/models/project/project.js";
import { TaskInputResolver } from "../../src/core/options/task-input-resolver.js";

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

const project: Project = {
	packageManager: "",
	currentWorkspaceId: "frontend",
	rootWorkspace: { label: "", id: "root", relativePath: "", configFilePath: "", absolutePath: "/path/to/root" },
	workspaces: [
		{ id: "frontend", relativePath: "", label: "frontend", configFilePath: null, absolutePath: "/path/to/frontend" },
		{ id: "backend", label: "backend", relativePath: "", configFilePath: null, absolutePath: "/path/to/backend" }
	]
};

const TasksByWorkspace = {
	root: ["build", "deploy", "lint"],

	backend: ["build", "test"],
	frontend: ["build", "clean", "prepare", "dev", "test"]
};

describe("TaskInputResolver", () => {
	const resolver = new TaskInputResolver(defaultLogger, (ws: string) => TasksByWorkspace[ws as "backend" | "root" | "frontend"]);

	it("resolves exact task names in target workspace", () => {
		expect(resolver.resolve(["build"], project)).toEqual(["frontend:build"]);
		expect(resolver.resolve(["backend:build"], project)).toEqual(["backend:build"]);
		expect(resolver.resolve(["root:build"], project)).toEqual(["root:build"]);
	});

	it("throws when task not found in target workspace", () => {
		expect(() => resolver.resolve(["release"], project)).toThrowPlainMessage("Task release not found in frontend nor root workspace.");
	});

	it("resolves task from fallback workspace if not found in target", () => {
		expect(resolver.resolve(["deploy"], project)).toEqual(["root:deploy"]);
	});

	it("suggests correct task name for typos in target workspace", () => {
		expect(resolver.resolve(["biuld"], project)).toEqual(["frontend:build"]);
		expect(resolver.resolve(["backend:biuld"], project)).toEqual(["backend:build"]);
		expect(resolver.resolve(["root:biuld"], project)).toEqual(["root:build"]);
	});

	it("suggests correct task name for typos from fallback workspace", () => {
		expect(resolver.resolve(["deplyo"], project)).toEqual(["root:deploy"]);
	});

	it("suggests correct workspace name for typos", () => {
		expect(resolver.resolve(["fronte:build"], project)).toEqual(["frontend:build"]);
		expect(resolver.resolve(["backe:build"], project)).toEqual(["backend:build"]);
	});

	it("throws when workspace not found", () => {
		expect(() => resolver.resolve(["unknown:build"], project)).toThrowPlainMessage("Workspace unknown not found.");
	});

	it("suggests correct task and workspace name for typos", () => {
		expect(resolver.resolve(["backe:biuld"], project)).toEqual(["backend:build"]);
	});
});
