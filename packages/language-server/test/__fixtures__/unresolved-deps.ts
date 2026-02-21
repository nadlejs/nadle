// @ts-nocheck -- intentional type errors for LSP analyzer testing
import { tasks, ExecTask } from "nadle";

tasks.register("compile", ExecTask, { command: "tsc" });

tasks.register("test", ExecTask, { command: "vitest" }).config({
	dependsOn: ["compile", "nonexistent"]
});

// Workspace-qualified dep (should NOT be flagged)
tasks.register("deploy", ExecTask, { command: "deploy" }).config({
	dependsOn: ["compile", "other-pkg:build"]
});

// Single string dependsOn with typo
tasks.register("release", ExecTask, { command: "npm" }).config({
	dependsOn: "typo-task"
});
