import { tasks } from "nadle";

import { createTask } from "./utils.js";

tasks.register(...createTask("task-A.0", { subTaskCount: 3, subTaskDuration: 600 }));
tasks.register(...createTask("task-A.1", { subTaskCount: 3, subTaskDuration: 800 }));
tasks.register(...createTask("task-A.2", { subTaskCount: 2, subTaskDuration: 700 }));
tasks.register(...createTask("task-A", { subTaskCount: 2, subTaskDuration: 500 })).config({ dependsOn: ["task-A.0", "task-A.1", "task-A.2"] });

tasks
	.register("throwable", () => {
		throw new Error("This is an error");
	})
	.config({ dependsOn: ["task-A.2", "task-A.1"] });
tasks
	.register("X", () => {
		console.log("Should not reach here");
	})
	.config({ dependsOn: ["throwable"] });
