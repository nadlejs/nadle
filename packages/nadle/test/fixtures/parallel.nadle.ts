import { createTask } from "./utils.js";
import { tasks } from "../../lib/index.js";

tasks.register(...createTask("task-A.0", { subTaskCount: 3, subTaskDuration: 300 }));
tasks.register(...createTask("task-A.1", { subTaskCount: 3, subTaskDuration: 800 }));
tasks.register(...createTask("task-A.2", { subTaskCount: 2, subTaskDuration: 500 }));
tasks.register(...createTask("task-A", { subTaskCount: 3, subTaskDuration: 200 })).config({ dependsOn: ["task-A.0", "task-A.1", "task-A.2"] });

tasks
	.register("throwable", () => {
		throw new Error("This is an error");
	})
	.config({ dependsOn: ["task-A.0", "task-A.1"] });
tasks
	.register("X", () => {
		console.log("Should not reach here");
	})
	.config({ dependsOn: ["throwable"] });
