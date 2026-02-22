import { tasks, Inputs, Outputs, PnpxTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("build", PnpxTask, { command: "tsc", args: ["-p", "tsconfig.build.json"] }).config({
	group: "Building",
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("lib")],
	description: "Compile kernel with tsc"
});

tasks.register("test", PnpxTask, { args: "run", command: "vitest" }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Run unit tests"
});
