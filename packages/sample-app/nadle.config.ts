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
tasks.register("hello", {
	group: "Greetings",
	description: "Say hello",
	run: async () => {
		console.log("Hello from Nadle!");
	}
});

tasks.register("goodbye", {
	group: "Greetings",
	dependsOn: ["hello"],
	description: "Say goodbye",
	run: () => {
		console.log("Goodbye, Nadle!");
	}
});

/**
 * Copy task
 */
tasks.register("copy", { run: CopyTask, dependsOn: ["prepare"], options: { to: "dist/", from: "assets/" } });

tasks.register("prepare", async () => {
	console.log("Preparing...");
});

/**
 * Error handling
 */

tasks.register("throwable", {
	dependsOn: ["prepare", "hello"],
	run: () => {
		throw new Error("This is an error");
	}
});

tasks.register("post-throwable", {
	dependsOn: ["throwable"],
	run: () => {
		console.log("It should not reach here");
	}
});

/**
 * Regular tasks
 */
tasks.register("node", () => {
	console.log("Setup node...");
});

tasks.register("install", {
	dependsOn: ["node"],
	run: () => {
		console.log("Installing npm...");
	}
});

tasks.register("compileTs", {
	run: PnpxTask,
	dependsOn: ["install"],
	outputs: [Outputs.dirs("dist")],
	inputs: [Inputs.files("src/**/*.ts")],
	options: { command: "tsc", args: ["--project", "tsconfig.src.json"] }
});

tasks.register("compileSvg", {
	dependsOn: ["install"],
	run: () => {
		console.log("Compiling svg...");
	}
});

tasks.register("compile", {
	dependsOn: ["compileSvg", "compileTs"],
	run: () => {
		console.log("Compiling...");
	}
});

tasks.register("test", {
	dependsOn: ["install"],
	run: () => {
		console.log("Running tests...");
	}
});

tasks.register("build", {
	dependsOn: ["test", "compile"],
	run: () => {
		console.log("Building...");
	}
});

/**
 * Progressive tasks
 */

tasks.register(...createTask("task-A-0", { subTaskCount: 3, subTaskDuration: 1500 }));
tasks.register(...createTask("task-A-1", { subTaskCount: 3, subTaskDuration: 2000 }));
tasks.register(...createTask("task-A-2", { subTaskCount: 3, subTaskDuration: 1200 }));
tasks.register("task-A", {
	dependsOn: ["task-A-0", "task-A-1", "task-A-2"],
	run: createTask("task-A", { subTaskCount: 3, subTaskDuration: 1000 })[1]
});

tasks.register(...createTask("task-B-0", { subTaskCount: 3, subTaskDuration: 1300 }));
tasks.register(...createTask("task-B-1", { subTaskCount: 3, subTaskDuration: 1700 }));
tasks.register(...createTask("task-B-2", { subTaskCount: 3, subTaskDuration: 1400 }));
tasks.register("task-B", {
	dependsOn: ["task-B-0", "task-B-1", "task-B-2"],
	run: createTask("task-B", { subTaskCount: 3, subTaskDuration: 1500 })[1]
});

tasks.register("task-C-0", { dependsOn: ["task-A", "task-B"], run: createTask("task-C-0", { subTaskCount: 3, subTaskDuration: 1200 })[1] });
tasks.register("task-C-1", { dependsOn: ["task-A", "task-B"], run: createTask("task-C-1", { subTaskCount: 3, subTaskDuration: 1500 })[1] });
tasks.register("task-C-2", { dependsOn: ["task-A", "task-B"], run: createTask("task-C-2", { subTaskCount: 3, subTaskDuration: 1300 })[1] });
tasks.register("task-C-3", { dependsOn: ["task-A", "task-B"], run: createTask("task-C-3", { subTaskCount: 3, subTaskDuration: 1300 })[1] });
tasks.register("task-C-4", { dependsOn: ["task-A", "task-B"], run: createTask("task-C-4", { subTaskCount: 3, subTaskDuration: 1300 })[1] });
tasks.register("task-C-5", { dependsOn: ["task-A", "task-B"], run: createTask("task-C-5", { subTaskCount: 3, subTaskDuration: 1300 })[1] });
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

tasks.register(
	"secondTask",
	lazy(() => ({ run: MyTask, env: { SECOND_TASK_ENV: "second task env" } }))
);

tasks.register("printWorkingDir", {
	workingDir: "../..",
	run: ({ context }) => {
		console.log(`Current working directory: ${context.workingDir}`);
	}
});

tasks.register("base");
tasks.register("fast", {
	dependsOn: ["base"],
	run: async () => {
		await new Promise((r) => setTimeout(r, 2000));
	}
});
tasks.register("slow", {
	dependsOn: ["base"],
	run: async () => {
		await new Promise((r) => setTimeout(r, 3000));
	}
});
