import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs, PnpxTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("build", PnpxTask, { args: [], command: "tsup" }).config({
	group: "Building",
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("lib")],
	description: "Bundle nadle with tsup"
});

tasks.register("generateMarkdown", PnpxTask, { args: [], command: "typedoc" }).config({
	group: "Building",
	description: "Generate API markdown with typedoc"
});

// --- Testing (nadle-specific, kept here due to workspace self-reference limitation) ---

tasks.register("testAPI", PnpxTask, { args: ["run"], command: "api-extractor" }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Verify API surface with api-extractor"
});

tasks
	.register("testNoWarningsAndUndocumentedAPI", async () => {
		const apiContent = await Fs.readFile(Path.join(import.meta.dirname, "index.api.md"), "utf-8");

		if (apiContent.includes("Warning:")) {
			throw new Error(`API documentation contains warnings`);
		}

		if (apiContent.includes("undocumented")) {
			throw new Error(`API documentation contains undocumented items`);
		}
	})
	.config({
		group: "Testing",
		dependsOn: ["testAPI"],
		description: "Ensure no API warnings or undocumented items"
	});

tasks.register("testUnit", PnpxTask, { args: ["run"], command: "vitest" }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Run unit tests"
});

tasks.register("test").config({
	group: "Testing",
	description: "Run all tests and checks",
	dependsOn: ["testUnit", "testAPI", "testNoWarningsAndUndocumentedAPI"]
});

// --- Maintenance (nadle-specific) ---

tasks.register("updateAPI", PnpxTask, { command: "api-extractor", args: ["run", "--local"] }).config({
	group: "Maintenance",
	dependsOn: ["build"],
	description: "Update API report locally"
});
