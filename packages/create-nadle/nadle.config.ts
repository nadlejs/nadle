import { tasks, Inputs, Outputs, ExecTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("build", ExecTask, { command: "tsc", args: ["-p", "tsconfig.build.json"] }).config({
	group: "Building",
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("lib")],
	description: "Compile create-nadle with tsc"
});

tasks.register("test", ExecTask, { command: "npx", args: ["vitest", "run"] }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Run unit tests"
});
