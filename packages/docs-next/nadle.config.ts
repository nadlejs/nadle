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

tasks.register("bundleSite", {
	run: PnpxTask,
	group: "Building",
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
