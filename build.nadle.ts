import { PnpmTask, tasks } from "nadle";

tasks.register("clean", PnpmTask, { args: ["-r", "exec", "rimraf", "lib"] }).config({ group: "clean", description: "Clean build folders" });
tasks
	.register("compile", PnpmTask, { args: ["-r", "--filter", "app", "exec", "tsc", "--pretty"] })
	.config({ group: "build", description: "Compile Typescript" });
