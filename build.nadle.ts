import { tasks, ExecTask, PnpmTask } from "nadle";

tasks.register("clean", PnpmTask, { args: ["-r", "exec", "rimraf", "lib"] });

tasks.register("eslint", PnpmTask, { args: ["eslint"] });
tasks.register("prettier", ExecTask, { command: "prettier", args: ["--check", "."] });
tasks.register("check", () => console.log("Checking...")).config({ dependsOn: ["eslint", "prettier"] });

tasks.register("build", PnpmTask, { args: ["run", "-r", "build"] }).config({ dependsOn: ["check"] });

tasks.register("test", PnpmTask, { args: ["run", "-r", "test"] }).config({ dependsOn: ["build"] });
