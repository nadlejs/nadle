import { tasks, PnpxTask } from "../../node_modules/nadle/lib/index.js";

tasks.register("build").config({
	group: "Building",
	dependsOn: ["root:compile"],
	description: "Compile create-nadle (delegates to root compile)"
});

tasks.register("test", PnpxTask, { args: "run", command: "vitest" }).config({
	group: "Testing",
	dependsOn: ["build"],
	description: "Run unit tests"
});
