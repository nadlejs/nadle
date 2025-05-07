import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { createJiti } from "jiti";

import { Consola } from "../consola.js";
import { listTasks } from "./list-tasks.js";
import { runTask } from "../core/run-task.js";
import { type CLIOptions } from "./options.js";

export async function runner(options: CLIOptions) {
	Consola.info(options);
	const configFile = resolve(process.cwd(), options.config);
	Consola.info(`Resolved config file: ${configFile}`);

	if (!existsSync(configFile)) {
		throw new Error(`Config file not found: ${configFile}`);
	}

	const jiti = createJiti(import.meta.url, {
		interopDefault: true,
		extensions: [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]
	});

	await jiti.import(pathToFileURL(configFile).toString());

	if (options.list) {
		listTasks();

		return;
	}

	const tasks = (options.tasks ?? []) as string[];

	if (tasks.length === 0) {
		Consola.log("No tasks specified");
		listTasks();

		return;
	}

	for (const task of tasks) {
		await runTask(task);
	}
}
