import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs, ExecTask, PnpmTask, DeleteTask } from "nadle";

tasks.register("clean", DeleteTask, {
	paths: ["**/lib/**", "**/build/**", "**/__temp__/**", "packages/docs/docs/api/**", "packages/docs/.docusaurus/**", "packages/docs/static/spec/**"]
});

tasks.register("spell", ExecTask, { command: "cspell", args: ["**", "--quiet", "--gitignore"] });
tasks.register("eslint", ExecTask, {
	command: "eslint",
	args: [".", "--quiet", "--cache", "--cache-location", "node_modules/.cache/eslint/"]
});
tasks.register("prettier", ExecTask, {
	command: "prettier",
	args: ["--check", ".", "--cache", "--cache-location", "node_modules/.cache/prettier/.prettierCache"]
});
tasks.register("knip", PnpmTask, { args: ["-r", "-F", "nadle", "-F", "create-nadle", "exec", "knip"] });
tasks.register("validate", ExecTask, { command: "tsx", args: ["./src/index.ts"] }).config({ workingDir: "./packages/validators" });
tasks.register("typecheck", ExecTask, { command: "tsc", args: ["-b", "--noEmit"] }).config({ dependsOn: ["buildNadle"] });
tasks.register("check").config({ dependsOn: ["spell", "eslint", "prettier", "knip", "validate"] });

tasks.register("buildNadle", PnpmTask, { args: ["-F", "nadle", "build"] }).config({
	inputs: [Inputs.dirs("packages/nadle/src")],
	outputs: [Outputs.dirs("packages/nadle/lib")]
});

tasks.register("generateMarkdown", ExecTask, { command: "npx", args: ["typedoc"] }).config({
	workingDir: "./packages/nadle"
});

tasks.register("prepareAPIMarkdown", ExecTask, { command: "tsx", args: ["scripts/adjust-api-markdown.ts"] }).config({
	workingDir: "./packages/docs",
	dependsOn: ["generateMarkdown"]
});

tasks.register("buildSpec", ExecTask, { command: "tsx", args: ["scripts/build-spec.ts"] }).config({
	workingDir: "./packages/docs",
	outputs: [Outputs.dirs("static/spec")],
	inputs: [Inputs.files("../../spec/*.md"), Inputs.files("scripts/build-spec.ts")]
});

tasks.register("buildDoc", PnpmTask, { args: ["-F", "@nadle/internal-docs", "build"] }).config({
	dependsOn: ["prepareAPIMarkdown", "buildSpec"],
	outputs: [Outputs.dirs("packages/docs/build")],
	inputs: [Inputs.dirs("packages/docs/{src,docs,static}"), Inputs.files("packages/docs/docusaurus.config.ts", "packages/docs/sidebars.ts")]
});

tasks.register("buildLsp", PnpmTask, { args: ["-F", "@nadle/internal-nadle-lsp", "build:tsup"] }).config({
	inputs: [Inputs.dirs("packages/nadle-lsp/src")],
	outputs: [Outputs.dirs("packages/nadle-lsp/lib")]
});

tasks.register("buildVscode", PnpmTask, { args: ["-F", "nadle-vscode", "build"] }).config({
	dependsOn: ["buildLsp"],
	outputs: [Outputs.dirs("packages/nadle-vscode/lib")],
	inputs: [Inputs.dirs("packages/nadle-vscode/src"), Inputs.files("packages/nadle-vscode/scripts/copy-server.mjs")]
});

tasks.register("packageVscode", PnpmTask, { args: ["-F", "nadle-vscode", "package"] }).config({
	dependsOn: ["buildVscode"]
});

tasks.register("buildOthers", PnpmTask, {
	args: ["-F", "!@nadle/internal-docs", "-F", "!nadle", "-F", "!@nadle/internal-nadle-lsp", "-F", "!nadle-vscode", "-r", "build"]
});
tasks.register("build").config({ dependsOn: ["buildNadle", "buildDoc", "buildLsp", "buildVscode", "buildOthers"] });

tasks.register("testLsp", PnpmTask, { args: ["-F", "@nadle/internal-nadle-lsp", "test", "--", "--run"] }).config({
	dependsOn: ["buildLsp"]
});

tasks.register("testUnit", PnpmTask, { args: ["run", "-r", "test"] }).config({ dependsOn: ["build"] });
tasks
	.register("testAPI", ExecTask, { args: ["run"], command: "api-extractor" })
	.config({ dependsOn: ["buildNadle"], workingDir: "./packages/nadle" });
tasks
	.register("testNoWarningsAndUndocumentedAPI", async ({ context }) => {
		const apiFilePath = Path.resolve(context.workingDir, "index.api.md");
		const apiContent = await Fs.readFile(apiFilePath, "utf-8");

		if (apiContent.includes("Warning:")) {
			throw new Error(`API documentation contains warnings`);
		}

		if (apiContent.includes("undocumented")) {
			throw new Error(`API documentation contains undocumented items`);
		}
	})
	.config({ dependsOn: ["testAPI"], workingDir: "./packages/nadle" });
tasks.register("test").config({ dependsOn: ["testUnit", "testLsp", "testAPI", "testNoWarningsAndUndocumentedAPI", "typecheck"] });

tasks.register("fixEslint", ExecTask, { command: "eslint", args: [".", "--quiet", "--fix"] });
tasks.register("fixPrettier", ExecTask, { command: "prettier", args: ["--write", "."] });
tasks.register("format").config({ dependsOn: ["fixEslint", "fixPrettier"] });
tasks
	.register("updateAPI", ExecTask, { command: "api-extractor", args: ["run", "--local"] })
	.config({ dependsOn: ["buildNadle"], workingDir: "./packages/nadle" });
