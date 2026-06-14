import { tasks, Inputs, Outputs, PnpxTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("buildSpec", { run: PnpxTask, options: { command: "tsx", args: "scripts/build-spec.ts" }, group: "Building",
	outputs: [Outputs.dirs("static/spec")],
	description: "Build spec HTML from markdown",
	inputs: [Inputs.files("../../spec/*.md"), Inputs.files("scripts/build-spec.ts")] });

tasks.register("buildCliReference", { run: PnpxTask, options: { command: "tsx", args: "scripts/build-cli-reference.ts" }, group: "Building",
	outputs: [Outputs.files("docs/cli-reference.md")],
	description: "Build CLI reference markdown from source",
	inputs: [Inputs.files("../nadle/src/core/options/cli-options.ts"), Inputs.files("scripts/build-cli-reference.ts")] });

tasks.register("prepareAPIMarkdown", { run: PnpxTask, options: { command: "tsx", args: "scripts/adjust-api-markdown.ts" }, group: "Building",
	dependsOn: ["packages:nadle:generateMarkdown"],
	description: "Prepare API markdown for docusaurus" });

tasks.register("buildSite", { run: PnpxTask, options: { args: "build", command: "docusaurus" }, group: "Building",
	outputs: [Outputs.dirs("build")],
	description: "Build documentation site",
	dependsOn: ["prepareAPIMarkdown", "buildSpec", "buildCliReference"],
	inputs: [Inputs.dirs("src", "docs", "static"), Inputs.files("docusaurus.config.ts", "sidebars.ts")] });
