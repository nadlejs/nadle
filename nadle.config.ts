import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs, ExecTask, PnpmTask, DeleteTask } from "nadle";

const baseEslintArgs = ["-r", "-F", "!@nadle/internal-nadle-test-fixtures-*", "exec", "eslint", ".", "--quiet"];

tasks.register("clean", DeleteTask, {
	paths: ["**/lib/**", "**/build/**", "**/__temp__/**", "packages/docs/docs/api/**", "packages/docs/.docusaurus/**"]
});

tasks.register("spell", ExecTask, { command: "cspell", args: ["**", "--quiet", "--gitignore"] });
tasks.register("eslint", PnpmTask, { args: [...baseEslintArgs, "--cache", "--cache-location", "node_modules/.cache/eslint/"] });
tasks.register("prettier", ExecTask, {
	command: "prettier",
	args: ["--check", ".", "--cache", "--cache-location", "node_modules/.cache/prettier/.prettierCache"]
});
tasks.register("knip", PnpmTask, { args: ["-r", "-F", "nadle", "-F", "create-nadle", "exec", "knip"] });
tasks.register("validate", ExecTask, { command: "tsx", args: ["./src/index.ts"] }).config({ workingDir: "./packages/validators" });
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

tasks.register("buildDoc", PnpmTask, { args: ["-F", "@nadle/internal-docs", "build"] }).config({
	dependsOn: ["prepareAPIMarkdown"],
	outputs: [Outputs.dirs("packages/docs/build")],
	inputs: [Inputs.dirs("packages/docs/{src,docs,static}"), Inputs.files("packages/docs/docusaurus.config.ts", "packages/docs/sidebars.ts")]
});

tasks.register("buildOthers", PnpmTask, { args: ["-F", "!@nadle/internal-docs", "-F", "!nadle", "-r", "build"] });
tasks.register("build").config({ dependsOn: ["buildNadle", "buildDoc", "buildOthers"] });

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
tasks.register("test").config({ dependsOn: ["testUnit", "testAPI", "testNoWarningsAndUndocumentedAPI"] });

tasks.register("fixEslint", PnpmTask, { args: [...baseEslintArgs, "--fix"] });
tasks.register("fixPrettier", ExecTask, { command: "prettier", args: ["--write", "."] });
tasks.register("format").config({ dependsOn: ["fixEslint", "fixPrettier"] });
tasks
	.register("updateAPI", ExecTask, { command: "api-extractor", args: ["run", "--local"] })
	.config({ dependsOn: ["buildNadle"], workingDir: "./packages/nadle" });
