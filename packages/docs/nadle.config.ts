import { tasks, Inputs, Outputs, PnpxTask } from "nadle";

tasks.register("buildSpec", {
	run: PnpxTask,
	group: "Building",
	outputs: [Outputs.dirs("static/spec")],
	description: "Build spec HTML from markdown",
	options: { command: "tsx", args: "scripts/build-spec.ts" },
	inputs: [Inputs.files("../../spec/*.md"), Inputs.files("scripts/build-spec.ts")]
});

tasks.register("buildCliReference", {
	run: PnpxTask,
	group: "Building",
	outputs: [Outputs.files("docs/cli-reference.md")],
	description: "Build CLI reference markdown from source",
	options: { command: "tsx", args: "scripts/build-cli-reference.ts" },
	inputs: [Inputs.files("../nadle/src/core/options/cli-options.ts"), Inputs.files("scripts/build-cli-reference.ts")]
});

tasks.register("prepareAPIMarkdown", {
	run: PnpxTask,
	group: "Building",
	dependsOn: ["packages:nadle:generateMarkdown"],
	description: "Prepare API markdown for docusaurus",
	options: { command: "tsx", args: "scripts/adjust-api-markdown.ts" }
});

tasks.register("buildSite", {
	run: PnpxTask,
	group: "Building",
	outputs: [Outputs.dirs("build")],
	description: "Build documentation site",
	options: { args: "build", command: "docusaurus" },
	dependsOn: ["prepareAPIMarkdown", "buildSpec", "buildCliReference"],
	inputs: [Inputs.dirs("src", "docs", "static"), Inputs.files("docusaurus.config.ts", "sidebars.ts")]
});
