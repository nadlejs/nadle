import { tasks, ExecTask } from "nadle";

tasks.register("buildTsup", ExecTask, { command: "npx", args: ["tsup"] }).config({
	group: "Building",
	description: "Bundle create-nadle with tsup"
});

tasks.register("buildTs", ExecTask, { command: "npx", args: ["tsc", "-p", "tsconfig.build.json"] }).config({
	group: "Building",
	description: "Type-check and emit declarations"
});

tasks.register("build").config({
	group: "Building",
	dependsOn: ["buildTsup", "buildTs"],
	description: "Build create-nadle package"
});
