import { it, expect, describe } from "vitest";
import { type Project } from "@nadle/project-resolver";

import { use } from "../../src/core/plugins/use.js";
import { runWithInstance } from "../../src/core/nadle-context.js";
import { PluginRegistry } from "../../src/core/plugins/plugin-registry.js";
import { TaskRegistry } from "../../src/core/registration/task-registry.js";

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

function withInstance(fn: () => void) {
	const taskRegistry = new TaskRegistry();
	const pluginRegistry = new PluginRegistry();
	taskRegistry.onConfigureWorkspace("root");
	runWithInstance({ taskRegistry, pluginRegistry, fileOptionRegistry: {} as never }, fn);

	return { taskRegistry, pluginRegistry };
}

describe("use", () => {
	it("records the plugin and its options in the registry", () => {
		const { pluginRegistry } = withInstance(() => {
			use({ hooks: {}, name: "timing" }, { threshold: 5 });
		});

		expect(pluginRegistry.getApplied()).toHaveLength(1);
		expect(pluginRegistry.getApplied()[0].options).toEqual({ threshold: 5 });
	});

	it("rejects a malformed plugin (missing name)", () => {
		expect(() =>
			withInstance(() => {
				use({} as never);
			})
		).toThrow(/plugin/i);
	});

	it("registers a contributed task type with its config", () => {
		const noop = { run: () => {} };
		const { taskRegistry } = withInstance(() => {
			use({
				name: "docker",
				tasks: [{ task: noop, name: "dockerBuild", config: { group: "docker" } }]
			});
		});

		taskRegistry.configure(project);

		const [task] = taskRegistry.getTaskByName("dockerBuild");
		expect(task).toBeDefined();
		expect(task.configResolver().group).toBe("docker");
	});
});
