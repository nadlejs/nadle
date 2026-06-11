import { tasks, Inputs, Outputs, ExecTask, PnpxTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("copy-server", ExecTask, { command: "node", args: ["scripts/copy-server.mjs"] }).config({
	group: "Building",
	dependsOn: ["root:bundle"],
	outputs: [Outputs.dirs("server")],
	description: "Copy LSP server into extension",
	inputs: [Inputs.dirs("../language-server/lib"), Inputs.files("scripts/copy-server.mjs")]
});

tasks.register("build").config({
	group: "Building",
	dependsOn: ["copy-server"],
	description: "Build vscode extension"
});

tasks.register("package", PnpxTask, { command: "vsce", args: "package" }).config({
	group: "Building",
	dependsOn: ["build"],
	description: "Package vscode extension (.vsix)"
});
