import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs, ExecTask, PnpmTask, DeleteTask } from "nadle";

// --- Maintenance ---

tasks
	.register("clean", DeleteTask, {
		paths: ["**/lib/**", "**/build/**", "**/__temp__/**", "packages/docs/docs/api/**", "packages/docs/.docusaurus/**", "packages/docs/static/spec/**"]
	})
	.config({ group: "Maintenance", description: "Delete all build artifacts and temp directories" });

// --- Checking ---

tasks.register("spell", ExecTask, { command: "cspell", args: ["**", "--quiet", "--gitignore"] }).config({
	group: "Checking",
	description: "Check spelling across all files"
});
tasks
	.register("eslint", ExecTask, {
		command: "eslint",
		args: [".", "--quiet", "--cache", "--cache-location", "node_modules/.cache/eslint/"]
	})
	.config({ group: "Checking", description: "Lint all files with ESLint" });
tasks
	.register("prettier", ExecTask, {
		command: "prettier",
		args: ["--check", ".", "--cache", "--cache-location", "node_modules/.cache/prettier/.prettierCache"]
	})
	.config({ group: "Checking", description: "Check formatting with Prettier" });
tasks.register("knip", PnpmTask, { args: ["-r", "-F", "nadle", "-F", "create-nadle", "exec", "knip"] }).config({
	group: "Checking",
	description: "Find unused dependencies and exports"
});
tasks.register("validate", ExecTask, { command: "tsx", args: ["./src/index.ts"] }).config({
	group: "Checking",
	workingDir: "./packages/validators",
	description: "Run package validators"
});
tasks.register("check").config({
	group: "Checking",
	dependsOn: ["spell", "eslint", "prettier", "knip", "validate"],
	description: "Run all checks (spell, lint, format, knip, validate)"
});

// --- Building (nadle-specific, kept here due to workspace self-reference limitation) ---

tasks.register("buildNadle", ExecTask, { command: "npx", args: ["tsup"] }).config({
	group: "Building",
	workingDir: "./packages/nadle",
	description: "Bundle nadle with tsup",
	inputs: [Inputs.dirs("packages/nadle/src")],
	outputs: [Outputs.dirs("packages/nadle/lib")]
});
tasks.register("buildNadleTs", ExecTask, { command: "npx", args: ["tsc", "-p", "tsconfig.build.json"] }).config({
	group: "Building",
	workingDir: "./packages/nadle",
	description: "Type-check nadle and emit declarations"
});
tasks.register("generateMarkdown", ExecTask, { command: "npx", args: ["typedoc"] }).config({
	group: "Building",
	workingDir: "./packages/nadle",
	description: "Generate API markdown with typedoc"
});
tasks.register("typecheck", ExecTask, { command: "tsc", args: ["-b", "--noEmit"] }).config({
	group: "Building",
	dependsOn: ["buildNadle", "buildNadleTs"],
	description: "Type-check all project references"
});
tasks.register("build").config({
	group: "Building",
	description: "Build all packages",
	dependsOn: [
		"buildNadle",
		"buildNadleTs",
		"packages:nadle-lsp:build",
		"packages:nadle-vscode:build",
		"packages:docs:build",
		"packages:create-nadle:build"
	]
});

// --- Testing (nadle-specific, kept here due to workspace self-reference limitation) ---

tasks.register("testAPI", ExecTask, { args: ["run"], command: "api-extractor" }).config({
	group: "Testing",
	workingDir: "./packages/nadle",
	dependsOn: ["buildNadle", "buildNadleTs"],
	description: "Verify API surface with api-extractor"
});
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
	.config({
		group: "Testing",
		dependsOn: ["testAPI"],
		workingDir: "./packages/nadle",
		description: "Ensure no API warnings or undocumented items"
	});
tasks.register("testUnit", PnpmTask, { args: ["run", "-r", "test"] }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Run unit tests across all workspaces"
});
tasks.register("test").config({
	group: "Testing",
	description: "Run all tests and checks",
	dependsOn: ["testUnit", "packages:nadle-lsp:test", "testAPI", "testNoWarningsAndUndocumentedAPI", "typecheck"]
});

// --- Formatting ---

tasks.register("fixEslint", ExecTask, { command: "eslint", args: [".", "--quiet", "--fix"] }).config({
	group: "Formatting",
	description: "Fix lint issues with ESLint"
});
tasks.register("fixPrettier", ExecTask, { command: "prettier", args: ["--write", "."] }).config({
	group: "Formatting",
	description: "Format all files with Prettier"
});
tasks.register("format").config({
	group: "Formatting",
	dependsOn: ["fixEslint", "fixPrettier"],
	description: "Fix lint and format all files"
});

// --- Maintenance (nadle-specific) ---

tasks.register("updateAPI", ExecTask, { command: "api-extractor", args: ["run", "--local"] }).config({
	group: "Maintenance",
	workingDir: "./packages/nadle",
	description: "Update API report locally",
	dependsOn: ["buildNadle", "buildNadleTs"]
});
