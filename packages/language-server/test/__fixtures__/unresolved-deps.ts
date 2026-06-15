// @ts-nocheck -- intentional type errors for LSP analyzer testing
import { tasks, ExecTask } from "nadle";

tasks.register("compile", { run: ExecTask, options: { command: "tsc" } });

tasks.register("test", {
	run: ExecTask,
	options: { command: "vitest" },
	dependsOn: ["compile", "nonexistent"]
});

// Workspace-qualified dep (should NOT be flagged)
tasks.register("deploy", {
	run: ExecTask,
	options: { command: "deploy" },
	dependsOn: ["compile", "other-pkg:build"]
});

// Single string dependsOn with typo
tasks.register("release", {
	run: ExecTask,
	dependsOn: "typo-task",
	options: { command: "npm" }
});
