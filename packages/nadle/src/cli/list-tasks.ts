import { Consola } from "../consola.js";
import { getRegisteredTasks } from "../core/register-task.js";

export function listTasks() {
	const tasks = getRegisteredTasks();

	if (tasks.length === 0) {
		Consola.log("No tasks found");

		return;
	}

	Consola.log("Available tasks:");
	tasks.forEach((task) => {
		Consola.log(`- ${task.name}`);
	});
}
