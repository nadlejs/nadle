import { tasks, Inputs, Outputs, PnpxTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("build", PnpxTask, { command: "tsgo", args: ["-p", "tsconfig.build.json"] }).config({
	group: "Building",
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("lib")],
	description: "Compile eslint-plugin with tsgo"
});

tasks.register("test", PnpxTask, { args: "run", command: "vitest" }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Run eslint-plugin tests"
});
