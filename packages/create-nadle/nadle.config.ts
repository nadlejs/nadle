import { tasks, ExecTask } from "../../node_modules/nadle/lib/index.js";

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

tasks.register("test", ExecTask, { command: "npx", args: ["vitest", "run"] }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Run unit tests"
});
