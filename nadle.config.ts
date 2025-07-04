import { tasks, Inputs, Outputs, ExecTask, PnpmTask, DeleteTask } from "nadle";

const baseEslintArgs = ["-r", "--filter", "!@nadle/internal-nadle-test-fixtures-*", "exec", "eslint", ".", "--quiet"];

tasks.register("clean", DeleteTask, {
	paths: ["**/lib/**", "**/build/**", "**/__temp__/**", "packages/docs/docs/api/**", "packages/docs/.docusaurus/**"]
});

tasks.register("spell", ExecTask, { command: "cspell", args: ["**", "--quiet", "--gitignore"] });
tasks.register("eslint", PnpmTask, { args: baseEslintArgs });
tasks.register("prettier", ExecTask, { command: "prettier", args: ["--check", "."] });
tasks.register("knip", ExecTask, { args: [], command: "knip" }).config({ workingDir: "./packages/nadle" });
tasks.register("validate", ExecTask, { command: "tsx", args: ["./src/index.ts"] }).config({ workingDir: "./packages/validators" });
tasks.register("check").config({ dependsOn: ["spell", "eslint", "prettier", "knip", "validate"] });

tasks.register("buildNadle", PnpmTask, { args: ["--filter", "nadle", "build"] }).config({
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

tasks.register("buildDoc", PnpmTask, { args: ["--filter", "@nadle/internal-docs", "build"] }).config({
	dependsOn: ["prepareAPIMarkdown"],
	outputs: [Outputs.dirs("packages/docs/build")],
	inputs: [Inputs.dirs("packages/docs/{src,docs,static}"), Inputs.files("packages/docs/docusaurus.config.ts", "packages/docs/sidebars.ts")]
});

tasks.register("buildOthers", PnpmTask, { args: ["--filter", "!@nadle/internal-docs", "--filter", "!nadle", "-r", "build"] });
tasks.register("build").config({ dependsOn: ["buildNadle", "buildDoc", "buildOthers"] });

tasks.register("testUnit", PnpmTask, { args: ["run", "-r", "test"] }).config({ dependsOn: ["build"] });
tasks.register("testAPI", ExecTask, { args: ["run"], command: "api-extractor" }).config({ dependsOn: ["build"], workingDir: "./packages/nadle" });
tasks.register("test").config({ dependsOn: ["testUnit", "testAPI"] });

tasks.register("fixEslint", PnpmTask, { args: [...baseEslintArgs, "--fix"] });
tasks.register("fixPrettier", ExecTask, { command: "prettier", args: ["--write", "."] });
tasks.register("format").config({ dependsOn: ["fixEslint", "fixPrettier"] });
tasks
	.register("updateAPI", ExecTask, { command: "api-extractor", args: ["run", "--local"] })
	.config({ dependsOn: ["buildNadle"], workingDir: "./packages/nadle" });
