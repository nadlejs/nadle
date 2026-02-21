import { tasks, ExecTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("build", ExecTask, { command: "npx", args: ["tsup"] }).config({
	group: "Building",
	description: "Bundle create-nadle with tsup"
});

tasks.register("test", ExecTask, { command: "npx", args: ["vitest", "run"] }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Run unit tests"
});
