import { tasks, Inputs, Outputs, PnpxTask } from "nadle";

tasks.register("dev", {
	run: PnpxTask,
	group: "Building",
	options: { args: ["dev"], command: "vitepress" },
	description: "Serve the documentation site with hot reload"
});

// The converted pages are committed; run this to refresh them after editing packages/docs.
tasks.register("convertContent", {
	run: PnpxTask,
	group: "Building",
	options: { command: "tsx", args: "scripts/convert-docusaurus.ts" },
	description: "Convert the Docusaurus pages, blog and sidebar of packages/docs to VitePress"
});

// The three generators below reuse the scripts of packages/docs, pointed at this package.
tasks.register("buildSpec", {
	run: PnpxTask,
	group: "Building",
	outputs: [Outputs.dirs("public/spec")],
	description: "Build spec HTML from markdown",
	inputs: [Inputs.files("../../spec/*.md"), Inputs.files("../docs/scripts/build-spec.ts")],
	options: { command: "tsx", args: ["../docs/scripts/build-spec.ts", "--out", "public/spec"] }
});

tasks.register("buildCliReference", {
	run: PnpxTask,
	group: "Building",
	outputs: [Outputs.files("docs/cli-reference.md")],
	description: "Build CLI reference markdown from source",
	options: {
		command: "tsx",
		args: ["../docs/scripts/build-cli-reference.ts", "--out", "docs/cli-reference.md"]
	},
	inputs: [Inputs.files("../nadle/src/core/options/cli-options.ts"), Inputs.files("../docs/scripts/build-cli-reference.ts")]
});

tasks.register("prepareAPIMarkdown", {
	run: PnpxTask,
	group: "Building",
	dependsOn: ["packages:nadle:generateMarkdownForDocsNext"],
	description: "Prepare API markdown and its sidebar for VitePress",
	options: {
		command: "tsx",
		args: ["../docs/scripts/adjust-api-markdown.ts", "--vitepress", "--dir", "docs/api", "--sidebar", ".vitepress/api-sidebar.json"]
	}
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
	description: "Build llms.txt and llms-full.txt from the docs pages",
	dependsOn: ["prepareAPIMarkdown", "buildCliReference"],
	options: { command: "tsx", args: "scripts/build-llms.ts" },
	outputs: [Outputs.files("public/llms.txt", "public/llms-full.txt")],
	inputs: [Inputs.dirs("docs"), Inputs.files(".vitepress/sidebar.json", "scripts/build-llms.ts", "scripts/page-source.ts")]
});

tasks.register("bundleSite", {
	run: PnpxTask,
	group: "Building",
	dependsOn: ["prepareAPIMarkdown", "buildSpec", "buildCliReference", "buildRss", "buildLlmsTxt"],
	outputs: [Outputs.dirs(".vitepress/dist")],
	options: { args: ["build"], command: "vitepress" },
	description: "Render the documentation site with VitePress",
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
