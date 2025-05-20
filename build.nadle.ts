import { tasks, ExecTask, PnpmTask } from "nadle";

tasks.register("clean", PnpmTask, { args: ["-r", "exec", "rimraf", "lib", "build"] });

tasks.register("spell", ExecTask, { command: "cspell", args: ["**", "--quiet", "--gitignore"] });
tasks.register("eslint", PnpmTask, { args: ["eslint"] });
tasks.register("prettier", ExecTask, { command: "prettier", args: ["--check", "."] });
tasks.register("knip", PnpmTask, { args: ["-r", "--filter", "./packages/nadle", "exec", "knip"] });
tasks.register("check").config({ dependsOn: ["spell", "eslint", "prettier", "knip"] });

tasks.register("build", PnpmTask, { args: ["run", "-r", "build"] }).config({ dependsOn: ["check"] });

tasks.register("testUnit", PnpmTask, { args: ["run", "-r", "test"] }).config({ dependsOn: ["build"] });
tasks
	.register("testAPI", PnpmTask, { args: ["-r", "--filter", "./packages/nadle", "exec", "api-extractor", "run"] })
	.config({ dependsOn: ["build"] });
tasks.register("test").config({ dependsOn: ["testUnit", "testAPI"] });

tasks.register("updateAPI", PnpmTask, { args: ["-r", "--filter", "./packages/nadle", "exec", "api-extractor", "run", "--local"] });
