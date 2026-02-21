import { tasks, Inputs, Outputs, PnpxTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("buildSpec", PnpxTask, { command: "tsx", args: "scripts/build-spec.ts" }).config({
	group: "Building",
	outputs: [Outputs.dirs("static/spec")],
	description: "Build spec HTML from markdown",
	inputs: [Inputs.files("../../spec/*.md"), Inputs.files("scripts/build-spec.ts")]
});

tasks.register("prepareAPIMarkdown", PnpxTask, { command: "tsx", args: "scripts/adjust-api-markdown.ts" }).config({
	group: "Building",
	dependsOn: ["packages:nadle:generateMarkdown"],
	description: "Prepare API markdown for docusaurus"
});

tasks.register("build", PnpxTask, { args: "build", command: "docusaurus" }).config({
	group: "Building",
	outputs: [Outputs.dirs("build")],
	description: "Build documentation site",
	dependsOn: ["prepareAPIMarkdown", "buildSpec"],
	inputs: [Inputs.dirs("src", "docs", "static"), Inputs.files("docusaurus.config.ts", "sidebars.ts")]
});
