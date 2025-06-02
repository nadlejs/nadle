import { tasks, ExecTask, PnpmTask } from "nadle";

tasks
	.register("clean", PnpmTask, { args: ["-r", "exec", "rimraf", "lib", "build", "dist"] })
	.config({ group: "Misc", description: "Clean build artifacts" });

tasks.register("spell", ExecTask, { command: "cspell", args: ["**", "--quiet", "--gitignore"] });
tasks.register("eslint", PnpmTask, { args: ["-r", "exec", "eslint", "--quiet"] });
tasks.register("prettier", ExecTask, { command: "prettier", args: ["--check", "."] });
tasks.register("knip", ExecTask, { args: [], command: "knip" }).config({ workingDir: "./packages/nadle" });
tasks.register("validate", ExecTask, { command: "tsx", args: ["./src/index.ts"] }).config({ workingDir: "./packages/validators" });
tasks.register("check").config({ dependsOn: ["spell", "eslint", "prettier", "knip", "validate"] });

tasks.register("build", PnpmTask, { args: ["-r", "build"] });

tasks.register("testUnit", PnpmTask, { args: ["run", "-r", "test"] }).config({ dependsOn: ["build"] });
tasks.register("testAPI", ExecTask, { args: ["run"], command: "api-extractor" }).config({ dependsOn: ["build"], workingDir: "./packages/nadle" });
tasks.register("test").config({ dependsOn: ["testUnit", "testAPI"] });

tasks.register("fixEslint", PnpmTask, { args: ["-r", "exec", "eslint", "--quiet", "--fix"] });
tasks.register("fixPrettier", ExecTask, { command: "prettier", args: ["--write", "."] });
tasks.register("format").config({ dependsOn: ["fixEslint", "fixPrettier"] });
tasks
	.register("updateAPI", ExecTask, { command: "api-extractor", args: ["run", "--local"] })
	.config({ dependsOn: ["build"], workingDir: "./packages/nadle" });
