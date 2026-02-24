// @ts-nocheck -- intentional type errors for LSP analyzer testing
import { tasks, ExecTask } from "nadle";

tasks.register("build", ExecTask, { command: "tsc" });

tasks.register("test", ExecTask, { command: "vitest" }).config({
	dependsOn: ["build", "lib:compile"]
});

// Reference to unknown workspace
tasks.register("deploy", ExecTask, { command: "deploy" }).config({
	dependsOn: "unknown-ws:build"
});

// Reference to known workspace but unknown task
tasks.register("check", ExecTask, { command: "check" }).config({
	dependsOn: "lib:nonexistent-task"
});
