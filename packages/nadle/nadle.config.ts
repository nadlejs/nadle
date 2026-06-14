import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs, PnpxTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("build", { group: "Building",
	dependsOn: ["root:bundle"],
	description: "Bundle nadle (delegates to root bundle)" });

tasks.register("generateMarkdown", { run: PnpxTask, options: { command: "typedoc" }, group: "Building",
	dependsOn: ["build"],
	outputs: [Outputs.dirs("../docs/docs/api")],
	description: "Generate API markdown with typedoc",
	inputs: [Inputs.dirs("lib"), Inputs.files("typedoc.json")] });

// --- Testing (nadle-specific, kept here due to workspace self-reference limitation) ---

tasks.register("testAPI", { run: PnpxTask, options: { args: ["run"], command: "api-extractor" }, group: "Testing",
	dependsOn: ["build"],
	outputs: [Outputs.dirs("build/api")],
	description: "Verify API surface with api-extractor",
	inputs: [Inputs.files("lib/index.d.ts", "api-extractor.json", "../../api-extractor.json", "index.api.md")] });

tasks.register("testNoWarningsAndUndocumentedAPI", { run: async () => {
		const apiContent = await Fs.readFile(Path.join(import.meta.dirname, "index.api.md"), "utf-8");

		if (apiContent.includes("Warning:")) {
			throw new Error(`API documentation contains warnings`);
		}

		if (apiContent.includes("undocumented")) {
			throw new Error(`API documentation contains undocumented items`);
		}
	}, group: "Testing",
		dependsOn: ["testAPI"],
		description: "Ensure no API warnings or undocumented items" });

tasks.register("test", { group: "Testing",
	description: "Run all tests and checks",
	dependsOn: ["testAPI", "testNoWarningsAndUndocumentedAPI"] });

// --- Maintenance (nadle-specific) ---

tasks.register("updateAPI", { run: PnpxTask, options: { command: "api-extractor", args: ["run", "--local"] }, group: "Maintenance",
	dependsOn: ["build"],
	description: "Update API report locally" });
