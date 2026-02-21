import { tasks, Inputs, Outputs, ExecTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("copy-server", ExecTask, { command: "node", args: ["scripts/copy-server.mjs"] }).config({
	group: "Building",
	description: "Copy LSP server into extension"
});

tasks.register("build-tsup", ExecTask, { command: "npx", args: ["tsup"] }).config({
	group: "Building",
	dependsOn: ["copy-server"],
	description: "Bundle vscode extension with tsup"
});

tasks.register("build").config({
	group: "Building",
	outputs: [Outputs.dirs("lib")],
	description: "Build vscode extension",
	dependsOn: ["copy-server", "build-tsup"],
	inputs: [Inputs.dirs("src"), Inputs.files("scripts/copy-server.mjs")]
});

tasks.register("package", ExecTask, { command: "npx", args: ["vsce", "package"] }).config({
	group: "Building",
	dependsOn: ["build"],
	description: "Package vscode extension (.vsix)"
});
