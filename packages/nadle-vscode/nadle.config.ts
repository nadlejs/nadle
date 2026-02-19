import { tasks, Inputs, Outputs, ExecTask } from "nadle";

tasks.register("copyServer", ExecTask, { command: "node", args: ["scripts/copy-server.mjs"] }).config({
	group: "Building",
	description: "Copy LSP server into extension"
});

tasks.register("buildTsup", ExecTask, { command: "npx", args: ["tsup"] }).config({
	group: "Building",
	dependsOn: ["copyServer"],
	description: "Bundle vscode extension with tsup"
});

tasks.register("build").config({
	group: "Building",
	outputs: [Outputs.dirs("lib")],
	description: "Build vscode extension",
	dependsOn: ["copyServer", "buildTsup"],
	inputs: [Inputs.dirs("src"), Inputs.files("scripts/copy-server.mjs")]
});

tasks.register("package", ExecTask, { command: "npx", args: ["vsce", "package"] }).config({
	group: "Building",
	dependsOn: ["build"],
	description: "Package vscode extension (.vsix)"
});
