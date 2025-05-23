import { tasks, ExecTask, PnpmTask } from "nadle";

tasks.register("clean", PnpmTask, { args: ["-r", "exec", "rimraf", "lib", "build"] }).config({ group: "Misc", description: "Clean build artifacts" });

tasks.register("spell", ExecTask, { command: "cspell", args: ["**", "--quiet", "--gitignore"] });
tasks.register("eslint", PnpmTask, { args: ["-r", "exec", "eslint", "--quiet"] });
tasks.register("prettier", ExecTask, { command: "prettier", args: ["--check", "."] });
tasks.register("knip", PnpmTask, { args: ["-r", "--filter", "./packages/nadle", "exec", "knip"] });
tasks.register("validate", ExecTask, { command: "tsx", args: ["./packages/validators/src/index.ts"] });
tasks.register("check").config({ dependsOn: ["spell", "eslint", "prettier", "knip", "validate"] });

tasks.register("compile", PnpmTask, { args: ["compile"] });

tasks.register("testUnit", PnpmTask, { args: ["run", "-r", "test"] }).config({ dependsOn: ["compile"] });
tasks
	.register("testAPI", PnpmTask, { args: ["-r", "--filter", "./packages/nadle", "exec", "api-extractor", "run"] })
	.config({ dependsOn: ["compile"] });
tasks.register("test").config({ dependsOn: ["testUnit", "testAPI"] });

tasks.register("updateAPI", PnpmTask, { args: ["-r", "--filter", "./packages/nadle", "exec", "api-extractor", "run", "--local"] });

tasks.register("build").config({ dependsOn: ["check", "compile", "test"] });

tasks.register("fixEslint", PnpmTask, { args: ["eslint", "--fix"] });
tasks.register("fixPrettier", ExecTask, { command: "prettier", args: ["--write", "."] });
tasks.register("format").config({ dependsOn: ["fixEslint", "fixPrettier"] });
