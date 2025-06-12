import process from "node:process";

import { tasks, ExecTask, type Task, configure } from "nadle";

import { createTask } from "./create-task.js";

configure({
	logLevel: "info",
	showSummary: false
});

/**
 * Basic tasks
 */

tasks
	.register("hello", async () => {
		console.log("Hello from Nadle!");
	})
	.config({ group: "Greetings", description: "Say hello" });

tasks
	.register("goodbye", () => {
		console.log("Goodbye, Nadle!");
	})
	.config({ group: "Greetings", dependsOn: ["hello"], description: "Say goodbye" });

/**
 * Copy task
 */

const CopyTask: Task<{ to: string; from: string }> = {
	run: ({ options }) => {
		const { to, from } = options;
		console.log(`Copying from ${from} to ${to}`);
	}
};

tasks.register("copy", CopyTask, { to: "dist/", from: "assets/" }).config({ dependsOn: ["prepare"] });

tasks.register("prepare", async () => {
	console.log("Preparing...");
});

/**
 * Error handling
 */

tasks
	.register("throwable", () => {
		throw new Error("This is an error");
	})
	.config({ dependsOn: ["prepare", "hello"] });

tasks
	.register("post-throwable", () => {
		console.log("It should not reach here");
	})
	.config({ dependsOn: ["throwable"] });

/**
 * Regular tasks
 */
tasks.register("node", () => {
	console.log("Setup node...");
});

tasks
	.register("install", () => {
		console.log("Installing npm...");
	})
	.config({ dependsOn: ["node"] });

tasks
	.register("compileTs", ExecTask, {
		command: "tsc",
		args: ["--project", "tsconfig.src.json"]
	})
	.config({ dependsOn: ["install"], inputs: ["src/**/*.ts"], outputs: ["dist/**/*.js"] });

tasks
	.register("compileSvg", () => {
		console.log("Compiling svg...");
	})
	.config({ dependsOn: ["install"] });

tasks
	.register("compile", () => {
		console.log("Compiling...");
	})
	.config({ dependsOn: ["compileSvg", "compileTs"] });

tasks
	.register("test", () => {
		console.log("Running tests...");
	})
	.config({ dependsOn: ["install"] });

tasks
	.register("build", () => {
		console.log("Building...");
	})
	.config({ dependsOn: ["test", "compile"] });

/**
 * Progressive tasks
 */

tasks.register(...createTask("task-A.0", { subTaskCount: 3, subTaskDuration: 1500 }));
tasks.register(...createTask("task-A.1", { subTaskCount: 3, subTaskDuration: 2000 }));
tasks.register(...createTask("task-A.2", { subTaskCount: 3, subTaskDuration: 1200 }));
tasks.register(...createTask("task-A", { subTaskCount: 3, subTaskDuration: 1000 })).config({ dependsOn: ["task-A.0", "task-A.1", "task-A.2"] });

tasks.register(...createTask("task-B.0", { subTaskCount: 3, subTaskDuration: 1300 }));
tasks.register(...createTask("task-B.1", { subTaskCount: 3, subTaskDuration: 1700 }));
tasks.register(...createTask("task-B.2", { subTaskCount: 3, subTaskDuration: 1400 }));
tasks.register(...createTask("task-B", { subTaskCount: 3, subTaskDuration: 1500 })).config({ dependsOn: ["task-B.0", "task-B.1", "task-B.2"] });

tasks.register(...createTask("task-C.0", { subTaskCount: 3, subTaskDuration: 1200 }));
tasks.register(...createTask("task-C.1", { subTaskCount: 3, subTaskDuration: 1500 }));
tasks.register(...createTask("task-C.2", { subTaskCount: 3, subTaskDuration: 1300 }));
tasks
	.register(...createTask("task-C", { subTaskCount: 3, subTaskDuration: 1000 }))
	.config({ dependsOn: ["task-A", "task-B", "task-C.0", "task-C.1", "task-C.2"] });

/**
 * Cycle tasks
 */
tasks.register("cycle-1").config({ dependsOn: ["cycle-2"] });
tasks.register("cycle-2").config({ dependsOn: ["cycle-3"] });
tasks.register("cycle-3").config({ dependsOn: ["cycle-4"] });
tasks.register("cycle-4").config({ dependsOn: ["cycle-5"] });
tasks.register("cycle-5").config({ dependsOn: ["cycle-2"] });

tasks.register("firstTask", () => console.log("firstTask")).config({ env: { FIRST_TASK_ENV: "first task env" } });

const MyTask: Task = {
	run: () => console.log(process.env.FIRST_TASK_ENV)
};

tasks.register("secondTask", MyTask, {}).config(() => ({ env: { SECOND_TASK_ENV: "second task env" } }));

tasks
	.register("printWorkingDir", ({ context }) => {
		console.log(`Current working directory: ${context.workingDir}`);
	})
	.config({
		workingDir: "../.."
	});

tasks.register("base");
tasks
	.register("fast", async () => {
		await new Promise((r) => setTimeout(r, 2000));
	})
	.config({ dependsOn: ["base"] });
tasks
	.register("slow", async () => {
		await new Promise((r) => setTimeout(r, 3000));
	})
	.config({ dependsOn: ["base"] });
