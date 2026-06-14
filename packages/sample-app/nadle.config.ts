import Process from "node:process";

import { Inputs } from "nadle";
import { lazy, tasks, Outputs, PnpxTask, CopyTask, type Task, configure } from "nadle";

import { createTask } from "./create-task.js";

configure({
	footer: true,
	maxWorkers: 3
});

/**
 * Basic tasks
 */
tasks.register("hello", { run: async () => {
		console.log("Hello from Nadle!");
	}, group: "Greetings", description: "Say hello" });

tasks.register("goodbye", { run: () => {
		console.log("Goodbye, Nadle!");
	}, group: "Greetings", dependsOn: ["hello"], description: "Say goodbye" });

/**
 * Copy task
 */
tasks.register("copy", { run: CopyTask, options: { to: "dist/", from: "assets/" }, dependsOn: ["prepare"] });

tasks.register("prepare", async () => {
	console.log("Preparing...");
});

/**
 * Error handling
 */

tasks.register("throwable", { run: () => {
		throw new Error("This is an error");
	}, dependsOn: ["prepare", "hello"] });

tasks.register("post-throwable", { run: () => {
		console.log("It should not reach here");
	}, dependsOn: ["throwable"] });

/**
 * Regular tasks
 */
tasks.register("node", () => {
	console.log("Setup node...");
});

tasks.register("install", { run: () => {
		console.log("Installing npm...");
	}, dependsOn: ["node"] });

tasks.register("compileTs", { run: PnpxTask, options: { command: "tsc",
		args: ["--project", "tsconfig.src.json"] }, dependsOn: ["install"], outputs: [Outputs.dirs("dist")], inputs: [Inputs.files("src/**/*.ts")] });

tasks.register("compileSvg", { run: () => {
		console.log("Compiling svg...");
	}, dependsOn: ["install"] });

tasks.register("compile", { run: () => {
		console.log("Compiling...");
	}, dependsOn: ["compileSvg", "compileTs"] });

tasks.register("test", { run: () => {
		console.log("Running tests...");
	}, dependsOn: ["install"] });

tasks.register("build", { run: () => {
		console.log("Building...");
	}, dependsOn: ["test", "compile"] });

/**
 * Progressive tasks
 */

tasks.register(...createTask("task-A-0", { subTaskCount: 3, subTaskDuration: 1500 }));
tasks.register(...createTask("task-A-1", { subTaskCount: 3, subTaskDuration: 2000 }));
tasks.register(...createTask("task-A-2", { subTaskCount: 3, subTaskDuration: 1200 }));
tasks.register("task-A", { run: createTask("task-A", { subTaskCount: 3, subTaskDuration: 1000 })[1], dependsOn: ["task-A-0", "task-A-1", "task-A-2"] });

tasks.register(...createTask("task-B-0", { subTaskCount: 3, subTaskDuration: 1300 }));
tasks.register(...createTask("task-B-1", { subTaskCount: 3, subTaskDuration: 1700 }));
tasks.register(...createTask("task-B-2", { subTaskCount: 3, subTaskDuration: 1400 }));
tasks.register("task-B", { run: createTask("task-B", { subTaskCount: 3, subTaskDuration: 1500 })[1], dependsOn: ["task-B-0", "task-B-1", "task-B-2"] });

tasks.register("task-C-0", { run: createTask("task-C-0", { subTaskCount: 3, subTaskDuration: 1200 })[1], dependsOn: ["task-A", "task-B"] });
tasks.register("task-C-1", { run: createTask("task-C-1", { subTaskCount: 3, subTaskDuration: 1500 })[1], dependsOn: ["task-A", "task-B"] });
tasks.register("task-C-2", { run: createTask("task-C-2", { subTaskCount: 3, subTaskDuration: 1300 })[1], dependsOn: ["task-A", "task-B"] });
tasks.register("task-C-3", { run: createTask("task-C-3", { subTaskCount: 3, subTaskDuration: 1300 })[1], dependsOn: ["task-A", "task-B"] });
tasks.register("task-C-4", { run: createTask("task-C-4", { subTaskCount: 3, subTaskDuration: 1300 })[1], dependsOn: ["task-A", "task-B"] });
tasks.register("task-C-5", { run: createTask("task-C-5", { subTaskCount: 3, subTaskDuration: 1300 })[1], dependsOn: ["task-A", "task-B"] });
tasks.register("task-C", {
	run: createTask("task-C", { subTaskCount: 3, subTaskDuration: 1000 })[1],
	dependsOn: ["task-A", "task-B", "task-C-0", "task-C-1", "task-C-2", "task-C-3", "task-C-4", "task-C-5"]
});

/**
 * Cycle tasks
 */
tasks.register("cycle-1", { dependsOn: ["cycle-2"] });
tasks.register("cycle-2", { dependsOn: ["cycle-3"] });
tasks.register("cycle-3", { dependsOn: ["cycle-4"] });
tasks.register("cycle-4", { dependsOn: ["cycle-5"] });
tasks.register("cycle-5", { dependsOn: ["cycle-2"] });

tasks.register("firstTask", { run: () => console.log("firstTask"), env: { FIRST_TASK_ENV: "first task env" } });

const MyTask: Task = {
	run: () => console.log(Process.env.FIRST_TASK_ENV)
};

tasks.register("secondTask", lazy(() => ({ run: MyTask, env: { SECOND_TASK_ENV: "second task env" } })));

tasks.register("printWorkingDir", { run: ({ context }) => {
		console.log(`Current working directory: ${context.workingDir}`);
	}, workingDir: "../.." });

tasks.register("base");
tasks.register("fast", { run: async () => {
		await new Promise((r) => setTimeout(r, 2000));
	}, dependsOn: ["base"] });
tasks.register("slow", { run: async () => {
		await new Promise((r) => setTimeout(r, 3000));
	}, dependsOn: ["base"] });
