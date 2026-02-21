import { tasks, PnpmTask, PnpxTask, DeleteTask } from "./node_modules/nadle/lib/index.js";

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
		description: "Lint all files with ESLint",
		dependsOn: ["packages:eslint-plugin:build"]
	});

tasks
	.register("prettier", PnpxTask, {
		command: "prettier",
		args: ["--check", ".", "--cache", "--cache-location", "node_modules/.cache/prettier/.prettierCache"]
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

tasks.register("typecheck", PnpxTask, { command: "tsc", args: ["-b", "--noEmit"] }).config({
	group: "Building",
	dependsOn: ["packages:nadle:build"],
	description: "Type-check all project references"
});

tasks.register("build").config({
	group: "Building",
	description: "Build all packages"
});

// --- Testing (nadle-specific, kept here due to workspace self-reference limitation) ---

tasks.register("test").config({
	group: "Testing",
	dependsOn: ["typecheck"],
	description: "Run all tests and checks"
});

// --- Formatting ---

tasks.register("fixEslint", PnpxTask, { command: "eslint", args: [".", "--quiet", "--fix"] }).config({
	group: "Formatting",
	description: "Fix lint issues with ESLint"
});

tasks.register("fixPrettier", PnpxTask, { command: "prettier", args: ["--write", "."] }).config({
	group: "Formatting",
	description: "Format all files with Prettier"
});

tasks.register("format").config({
	group: "Formatting",
	dependsOn: ["fixEslint", "fixPrettier"],
	description: "Fix lint and format all files"
});
