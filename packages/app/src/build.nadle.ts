import { tasks, type Task } from "nadle";

import { createTask } from "./create-task.js";

const CopyTask: Task<{ to: string; from: string }> = {
	run: ({ options }) => {
		const { to, from } = options;
		console.log(`Copying from ${from} to ${to}`);
	}
};

tasks.register("hello", async () => {
	await new Promise((r) => setTimeout(r, 300));
	console.log("Hello from nadle!");
});

tasks
	.register("goodbye", () => {
		console.log("Goodbye, tak!");
	})
	.config({ dependsOn: ["hello"] });

tasks.register("copy", CopyTask, { to: "dist/", from: "assets/" }).config({ dependsOn: ["prepare"] });

tasks.register("prepare", async () => {
	console.log("Preparing...");
});

tasks.register("node", async () => {
	console.log("Setup node...");
});

tasks
	.register("install", async () => {
		console.log("Installing npm...");
	})
	.config({ dependsOn: ["node"] });

tasks
	.register("compileTs", () => {
		console.log("Compiling ts...");
	})
	.config({ dependsOn: ["install"] });

tasks.register("compileSvg", () => {
	console.log("Compiling svg...");
});

tasks
	.register("compile", () => {
		console.log("Compiling...");
	})
	.config({ dependsOn: ["compileSvg", "compileTs"] });

tasks
	.register("test", () => {
		console.log("Running tests...");
	})
	.config({ dependsOn: ["compile"] });

tasks
	.register("build", () => {
		console.log("Building...");
	})
	.config({ dependsOn: ["test", "compile"] });

/**
 * Progressive tasks
 */

tasks.register(...createTask("task-1", { subTaskCount: 5, subTaskDuration: 800 }));
tasks.register(...createTask("task-2", { subTaskCount: 6, subTaskDuration: 900 })).config({ dependsOn: ["task-1"] });
tasks.register(...createTask("task-3", { subTaskCount: 7, subTaskDuration: 1000 })).config({ dependsOn: ["task-2", "task-1"] });
