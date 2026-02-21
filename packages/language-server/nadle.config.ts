import { tasks, Inputs, Outputs, PnpxTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("build", PnpxTask, { command: "tsup" }).config({
	group: "Building",
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("lib")],
	description: "Bundle language-server with tsup"
});

tasks.register("test", PnpxTask, { args: "run", command: "vitest" }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Run LSP unit tests"
});
