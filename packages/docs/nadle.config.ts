import { tasks, Inputs, Outputs, PnpxTask } from "nadle";

tasks.register("dev", {
	run: PnpxTask,
	group: "Building",
	options: { args: ["dev"], command: "vitepress" },
	description: "Serve the documentation site with hot reload"
});

tasks.register("buildSpec", {
	run: PnpxTask,
	group: "Building",
	outputs: [Outputs.dirs("public/spec")],
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
	description: "Prepare API markdown and its sidebar for VitePress",
	options: { command: "tsx", args: "scripts/adjust-api-markdown.ts" }
});

tasks.register("buildRss", {
	run: PnpxTask,
	group: "Building",
	outputs: [Outputs.files("public/rss.xml")],
	description: "Build the RSS feed of the blog",
	options: { command: "tsx", args: "scripts/build-rss.ts" },
	inputs: [Inputs.dirs("blog"), Inputs.files("scripts/build-rss.ts", "scripts/page-source.ts")]
});

tasks.register("buildLlmsTxt", {
	run: PnpxTask,
	group: "Building",
	dependsOn: ["prepareAPIMarkdown", "buildCliReference"],
	options: { command: "tsx", args: "scripts/build-llms.ts" },
	description: "Build llms.txt and llms-full.txt from the docs pages",
	outputs: [Outputs.files("public/llms.txt", "public/llms-full.txt")],
	inputs: [Inputs.dirs("docs"), Inputs.files(".vitepress/sidebar.json", "scripts/build-llms.ts", "scripts/page-source.ts")]
});

tasks.register("bundleSite", {
	run: PnpxTask,
	group: "Building",
	outputs: [Outputs.dirs(".vitepress/dist")],
	options: { args: ["build"], command: "vitepress" },
	description: "Render the documentation site with VitePress",
	dependsOn: ["prepareAPIMarkdown", "buildSpec", "buildCliReference", "buildRss", "buildLlmsTxt"],
	inputs: [Inputs.dirs(".vitepress", "docs", "blog", "public"), Inputs.files("index.md", "../../pnpm-lock.yaml")]
});

tasks.register("checkSite", {
	run: PnpxTask,
	group: "Checking",
	dependsOn: ["bundleSite"],
	options: { command: "tsx", args: "scripts/check-chunks.ts" },
	description: "Fail when a built page references a JS chunk that was not emitted"
});

tasks.register("buildSite", {
	group: "Building",
	dependsOn: ["checkSite"],
	description: "Build the documentation site and verify its output"
});
