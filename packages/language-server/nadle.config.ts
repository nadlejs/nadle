import { tasks, Inputs, Outputs, ExecTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("build", ExecTask, { command: "npx", args: ["tsup"] }).config({
	group: "Building",
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("lib")],
	description: "Bundle language-server with tsup"
});

tasks.register("test", ExecTask, { command: "npx", args: ["vitest", "run"] }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Run LSP unit tests"
});
