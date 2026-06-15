import { tasks, Inputs, Outputs, PnpmTask, PnpxTask, DeleteTask } from "nadle";

// --- Maintenance ---

tasks.register("clean", {
	run: DeleteTask,
	group: "Maintenance",
	description: "Delete all build artifacts and temp directories",
	options: {
		paths: ["**/lib/**", "**/build/**", "**/__temp__/**", "packages/docs/docs/api/**", "packages/docs/.docusaurus/**", "packages/docs/static/spec/**"]
	}
});

// --- Checking ---

tasks.register("spell", {
	run: PnpxTask,
	group: "Checking",
	description: "Check spelling across all files",
	options: { command: "cspell", args: ["**", "--quiet", "--gitignore", "--cache", "--cache-location", "node_modules/.cache/cspell/.cspellcache"] }
});

tasks.register("eslint", {
	run: PnpxTask,
	group: "Checking",
	dependsOn: ["compile"],
	description: "Lint all files with ESLint",
	options: { command: "eslint", args: [".", "--quiet", "--cache", "--cache-location", "node_modules/.cache/eslint/"] }
});

tasks.register("prettier", {
	run: PnpxTask,
	group: "Checking",
	description: "Check formatting with Prettier",
	options: { command: "prettier", args: ["--experimental-cli", "--check", "."] }
});

tasks.register("knip", {
	run: PnpmTask,
	group: "Checking",
	description: "Find unused dependencies and exports",
	options: { args: ["-r", "-F", "nadle", "-F", "create-nadle", "exec", "knip"] }
});

tasks.register("validate", {
	run: PnpxTask,
	group: "Checking",
	workingDir: "./packages/validators",
	description: "Run package validators",
	options: { command: "tsx", args: "./src/index.ts" }
});

tasks.register("checkLinks", {
	run: PnpxTask,
	group: "Checking",
	options: { command: "remark", args: ["--quiet", "--frail", "spec/"] },
	description: "Check for broken Markdown links and anchors in the spec"
});

tasks.register("check", {
	group: "Checking",
	description: "Run all checks (spell, lint, format, knip, validate, links)",
	dependsOn: ["spell", "eslint", "prettier", "knip", "validate", "checkLinks"]
});

// --- Building (nadle-specific, kept here due to workspace self-reference limitation) ---

tasks.register("typecheck", {
	run: PnpxTask,
	group: "Building",
	// Depends on bundle: test files import "nadle"/"@nadle/language-server", whose .d.ts
	// are emitted by tsup (bundle), not by compile. Without this, typecheck can race ahead
	// of bundle on a clean build and fail to resolve those package types.
	dependsOn: ["compile", "bundle"],
	description: "Type-check all project references",
	options: { command: "tsgo", args: ["-b", "--noEmit"] }
});

tasks.register("compile", {
	run: PnpxTask,
	group: "Building",
	options: { command: "tsgo", args: ["-b", "./tsconfig.compile.json"] },
	description: "Compile and type-check all tsgo-built packages in one pass",
	outputs: [Outputs.dirs("packages/kernel/lib", "packages/project-resolver/lib", "packages/create-nadle/lib", "packages/eslint-plugin/lib")],
	inputs: [
		Inputs.dirs("packages/kernel/src", "packages/project-resolver/src", "packages/create-nadle/src", "packages/eslint-plugin/src"),
		Inputs.files("tsconfig.compile.json", "tsconfig.src.json", "tsconfig.base.json", "packages/*/tsconfig.build.json", "pnpm-lock.yaml")
	]
});

tasks.register("bundle", {
	run: PnpxTask,
	group: "Building",
	dependsOn: ["compile"],
	options: { command: "tsup" },
	description: "Bundle all tsup-based packages in one pass",
	outputs: [Outputs.dirs("packages/nadle/lib", "packages/language-server/lib", "packages/vscode-extension/lib")],
	inputs: [
		Inputs.dirs("packages/nadle/src", "packages/language-server/src", "packages/vscode-extension/src"),
		Inputs.files("tsup.config.ts", "tsconfig.src.json", "tsconfig.base.json", "pnpm-lock.yaml")
	]
});

tasks.register("build", {
	group: "Building",
	dependsOn: ["compile", "typecheck", "bundle"],
	description: "Compile, type-check, and bundle all packages"
});

// --- Testing (nadle-specific, kept here due to workspace self-reference limitation) ---

tasks.register("testUnit", {
	run: PnpxTask,
	group: "Testing",
	dependsOn: ["bundle"],
	options: { args: ["run"], command: "vitest" },
	description: "Run all vitest projects (filter via passthrough, e.g. nadle testUnit -- --project kernel)"
});

tasks.register("test", { group: "Testing", dependsOn: ["typecheck", "testUnit"], description: "Run all tests and checks" });

// --- Formatting ---

tasks.register("fixEslint", {
	run: PnpxTask,
	group: "Formatting",
	dependsOn: ["compile"],
	description: "Fix lint issues with ESLint",
	options: { command: "eslint", args: [".", "--quiet", "--fix"] }
});

tasks.register("fixPrettier", {
	run: PnpxTask,
	group: "Formatting",
	description: "Format all files with Prettier",
	options: { command: "prettier", args: ["--experimental-cli", "--write", "."] }
});

tasks.register("format", { group: "Formatting", dependsOn: ["fixEslint", "fixPrettier"], description: "Fix lint and format all files" });
