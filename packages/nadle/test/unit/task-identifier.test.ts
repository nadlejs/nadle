import { it, expect, describe } from "vitest";

import { TaskIdentifier } from "../../src/core/models/task-identifier.js";

describe.concurrent("TaskIdentifier.create", () => {
	it("joins workspace and task name with colon", () => {
		expect(TaskIdentifier.create("frontend", "build")).toBe("frontend:build");
	});

	it("returns bare task name when workspace is empty", () => {
		expect(TaskIdentifier.create("", "build")).toBe("build");
	});

	it("handles nested workspace ids with colons", () => {
		expect(TaskIdentifier.create("packages:ui", "test")).toBe("packages:ui:test");
	});
});

describe.concurrent("TaskIdentifier.parser", () => {
	it("parses simple task name without workspace", () => {
		expect(TaskIdentifier.parser("build")).toEqual({
			taskNameInput: "build",
			workspaceInput: undefined
		});
	});

	it("parses workspace:task format", () => {
		expect(TaskIdentifier.parser("frontend:build")).toEqual({
			taskNameInput: "build",
			workspaceInput: "frontend"
		});
	});

	it("parses nested workspace with multiple colons", () => {
		expect(TaskIdentifier.parser("packages:ui:test")).toEqual({
			taskNameInput: "test",
			workspaceInput: "packages:ui"
		});
	});

	it("handles single colon prefix", () => {
		expect(TaskIdentifier.parser(":build")).toEqual({
			workspaceInput: "",
			taskNameInput: "build"
		});
	});
});
