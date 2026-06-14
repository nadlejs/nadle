import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs, PnpxTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("build").config({
	group: "Building",
	dependsOn: ["root:bundle"],
	description: "Bundle nadle (delegates to root bundle)"
});

tasks.register("generateMarkdown", PnpxTask, { command: "typedoc" }).config({
	group: "Building",
	dependsOn: ["build"],
	outputs: [Outputs.dirs("../docs/docs/api")],
	description: "Generate API markdown with typedoc",
	inputs: [Inputs.dirs("lib"), Inputs.files("typedoc.json")]
});

// --- Testing (nadle-specific, kept here due to workspace self-reference limitation) ---

tasks.register("testAPI", PnpxTask, { args: ["run"], command: "api-extractor" }).config({
	group: "Testing",
	dependsOn: ["build"],
	outputs: [Outputs.dirs("build/api")],
	description: "Verify API surface with api-extractor",
	inputs: [Inputs.files("lib/index.d.ts", "api-extractor.json", "../../api-extractor.json", "index.api.md")]
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

tasks.register("test").config({
	group: "Testing",
	description: "Run all tests and checks",
	dependsOn: ["testAPI", "testNoWarningsAndUndocumentedAPI"]
});

// --- Maintenance (nadle-specific) ---

tasks.register("updateAPI", PnpxTask, { command: "api-extractor", args: ["run", "--local"] }).config({
	group: "Maintenance",
	dependsOn: ["build"],
	description: "Update API report locally"
});
