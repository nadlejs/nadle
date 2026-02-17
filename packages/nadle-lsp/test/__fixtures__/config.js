const { tasks, ExecTask } = require("nadle");

tasks.register("build", ExecTask, { command: "tsc" });
tasks.register("test", ExecTask, { command: "vitest" }).config({
	dependsOn: ["build"]
});
