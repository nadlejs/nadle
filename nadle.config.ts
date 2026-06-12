import { tasks, Inputs, Outputs, PnpmTask, PnpxTask, DeleteTask } from "./node_modules/nadle/lib/index.js";

// --- Maintenance ---

tasks
	.register("clean", DeleteTask, {
		paths: ["**/lib/**", "**/build/**", "**/__temp__/**", "packages/docs/docs/api/**", "packages/docs/.docusaurus/**", "packages/docs/static/spec/**"]
	})
	.config({ group: "Maintenance", description: "Delete all build artifacts and temp directories" });

// --- Checking ---

tasks.register("spell", PnpxTask, { command: "cspell", args: ["**", "--quiet", "--gitignore"] }).config({
	group: "Checking",
	description: "Check spelling across all files"
});

tasks
	.register("eslint", PnpxTask, {
		command: "eslint",
		args: [".", "--quiet", "--cache", "--cache-location", "node_modules/.cache/eslint/"]
	})
	.config({
		group: "Checking",
		dependsOn: ["compile"],
		description: "Lint all files with ESLint"
	});

tasks
	.register("prettier", PnpxTask, {
		command: "prettier",
		args: ["--experimental-cli", "--check", ".", "--cache", "--cache-location", "node_modules/.cache/prettier/.prettierCache"]
	})
	.config({ group: "Checking", description: "Check formatting with Prettier" });

tasks.register("knip", PnpmTask, { args: ["-r", "-F", "nadle", "-F", "create-nadle", "exec", "knip"] }).config({
	group: "Checking",
	description: "Find unused dependencies and exports"
});

tasks.register("validate", PnpxTask, { command: "tsx", args: "./src/index.ts" }).config({
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

tasks.register("typecheck", PnpxTask, { command: "tsgo", args: ["-b", "--noEmit"] }).config({
	group: "Building",
	dependsOn: ["bundle"],
	description: "Type-check all project references"
});

tasks.register("compile", PnpxTask, { command: "tsgo", args: ["-b", "./tsconfig.compile.json"] }).config({
	group: "Building",
	description: "Compile and type-check all tsgo-built packages in one pass",
	outputs: [Outputs.dirs("packages/kernel/lib", "packages/project-resolver/lib", "packages/create-nadle/lib", "packages/eslint-plugin/lib")],
	inputs: [
		Inputs.dirs("packages/kernel/src", "packages/project-resolver/src", "packages/create-nadle/src", "packages/eslint-plugin/src"),
		Inputs.files("tsconfig.compile.json", "tsconfig.src.json", "tsconfig.base.json", "packages/*/tsconfig.build.json")
	]
});

tasks.register("bundle", PnpxTask, { command: "tsup" }).config({
	group: "Building",
	dependsOn: ["compile"],
	description: "Bundle all tsup-based packages in one pass",
	outputs: [Outputs.dirs("packages/nadle/lib", "packages/language-server/lib", "packages/vscode-extension/lib")],
	inputs: [
		Inputs.dirs("packages/nadle/src", "packages/language-server/src", "packages/vscode-extension/src"),
		Inputs.files("tsup.config.ts", "tsconfig.src.json", "tsconfig.base.json")
	]
});

tasks.register("dist").config({
	group: "Building",
	description: "Bundle all tsup-based packages",
	dependsOn: ["bundle", "packages:vscode-extension:copy-server"]
});

tasks.register("build").config({
	group: "Building",
	dependsOn: ["compile", "typecheck", "bundle"],
	description: "Compile, type-check, and bundle all packages"
});

// --- Testing (nadle-specific, kept here due to workspace self-reference limitation) ---

tasks.register("testUnit", PnpxTask, { args: ["run"], command: "vitest" }).config({
	group: "Testing",
	dependsOn: ["compile", "bundle"],
	description: "Run all vitest projects (filter via passthrough, e.g. nadle testUnit -- --project kernel)"
});

tasks.register("test").config({
	group: "Testing",
	dependsOn: ["typecheck", "testUnit"],
	description: "Run all tests and checks"
});

// --- Formatting ---

tasks.register("fixEslint", PnpxTask, { command: "eslint", args: [".", "--quiet", "--fix"] }).config({
	group: "Formatting",
	description: "Fix lint issues with ESLint"
});

tasks.register("fixPrettier", PnpxTask, { command: "prettier", args: ["--experimental-cli", "--write", "."] }).config({
	group: "Formatting",
	description: "Format all files with Prettier"
});

tasks.register("format").config({
	group: "Formatting",
	dependsOn: ["fixEslint", "fixPrettier"],
	description: "Fix lint and format all files"
});
