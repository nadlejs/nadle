import { tasks, Inputs, Outputs, ExecTask } from "nadle";

tasks.register("buildJs", ExecTask, { command: "npx", args: ["tsup"] }).config({
	group: "Building",
	description: "Bundle nadle-lsp with tsup"
});

tasks.register("buildDts", ExecTask, { command: "npx", args: ["tsc", "-p", "tsconfig.build.json"] }).config({
	group: "Building",
	description: "Type-check and emit declarations"
});

tasks.register("build").config({
	group: "Building",
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("lib")],
	dependsOn: ["buildJs", "buildDts"],
	description: "Build nadle-lsp package"
});

tasks.register("test", ExecTask, { args: ["run"], command: "vitest" }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Run LSP unit tests"
});
