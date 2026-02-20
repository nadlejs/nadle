import { tasks, Inputs, Outputs, ExecTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("buildSpec", ExecTask, { command: "npx", args: ["tsx", "scripts/build-spec.ts"] }).config({
	group: "Building",
	outputs: [Outputs.dirs("static/spec")],
	description: "Build spec HTML from markdown",
	inputs: [Inputs.files("../../spec/*.md"), Inputs.files("scripts/build-spec.ts")]
});

tasks.register("prepareAPIMarkdown", ExecTask, { command: "npx", args: ["tsx", "scripts/adjust-api-markdown.ts"] }).config({
	group: "Building",
	dependsOn: ["packages:nadle:generateMarkdown"],
	description: "Prepare API markdown for docusaurus"
});

tasks.register("build", ExecTask, { command: "npx", args: ["docusaurus", "build"] }).config({
	group: "Building",
	outputs: [Outputs.dirs("build")],
	description: "Build documentation site",
	dependsOn: ["prepareAPIMarkdown", "buildSpec"],
	inputs: [Inputs.dirs("src", "docs", "static"), Inputs.files("docusaurus.config.ts", "sidebars.ts")]
});
