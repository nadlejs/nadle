import { it, expect, describe } from "vitest";
import { type Project } from "@nadle/project-resolver";

import { tasks } from "../../src/core/registration/api.js";
import { runWithInstance } from "../../src/core/nadle-context.js";
import { TaskRegistry } from "../../src/core/registration/task-registry.js";

// Minimal project with only a root workspace, enough for TaskRegistry.configure.
const project = {
	workspaces: [],
	packageManager: "pnpm",
	currentWorkspaceId: "root",
	rootWorkspace: {
		label: "",
		id: "root",
		relativePath: "",
		dependencies: [],
		absolutePath: "/repo",
		configFilePath: "/repo/nadle.config.ts",
		packageJson: { name: "root", version: "0.0.0" }
	}
} as unknown as Project;

describe("lazy task configuration (#647)", () => {
	it("resolves a task's config callback at most once, regardless of how many times it is read", () => {
		const registry = new TaskRegistry();
		let calls = 0;

		runWithInstance({ taskRegistry: registry, fileOptionRegistry: {} as never }, () => {
			registry.onConfigureWorkspace("root");

			tasks.register("build").config(() => {
				calls += 1;

				return { group: "build" };
			});
		});

		registry.configure(project);
		const [task] = registry.getTaskByName("build");

		// Read the config several times — the scheduler, worker, and reporter all do.
		task.configResolver();
		task.configResolver();
		const config = task.configResolver();

		expect(calls).toBe(1);
		expect(config).toEqual({ group: "build" });
	});
});
