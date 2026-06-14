// @ts-nocheck -- intentional type errors for LSP analyzer testing
import { tasks, ExecTask } from "nadle";

tasks.register("build", { run: ExecTask, options: { command: "tsc" } });

tasks.register("test", {
	run: ExecTask,
	options: { command: "vitest" },
	dependsOn: ["build", "lib:compile"]
});

// Reference to unknown workspace
tasks.register("deploy", {
	run: ExecTask,
	dependsOn: "unknown-ws:build",
	options: { command: "deploy" }
});

// Reference to known workspace but unknown task
tasks.register("check", {
	run: ExecTask,
	options: { command: "check" },
	dependsOn: "lib:nonexistent-task"
});
