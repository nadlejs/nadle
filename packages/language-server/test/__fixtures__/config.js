// @ts-nocheck -- LSP fixture; analyzed as AST, not compiled
const { tasks, ExecTask } = require("nadle");

tasks.register("build", { run: ExecTask, options: { command: "tsc" } });
tasks.register("test", {
	run: ExecTask,
	options: { command: "vitest" },
	dependsOn: ["build"]
});
