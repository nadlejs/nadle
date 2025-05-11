import process from "node:process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { createJiti } from "jiti";

import { Logger } from "./logger.js";
import { type Context } from "./types.js";
import { TaskRunner } from "./task-runner.js";
import { type LogLevel } from "./constants.js";
import { taskRegistry } from "./task-registry.js";
import { type Reporter, DefaultReporter } from "./reporter.js";

export interface Options {
	readonly tasks?: string[];

	readonly configPath: string;

	readonly list?: boolean;
	readonly logLevel: LogLevel;
	readonly showSummary: boolean;
}

export class Nadle {
	public readonly logger: Logger;
	public readonly taskRunner: TaskRunner;
	public readonly reporter: Reporter;
	public readonly registry = taskRegistry;

	constructor(public readonly options: Options) {
		this.logger = new Logger(options.logLevel);
		this.taskRunner = new TaskRunner(this);
		this.reporter = new DefaultReporter(this);

		this.reporter.onInit?.(this);
	}

	async execute() {
		await this.registerTask();

		if (this.options.list) {
			this.listTasks();

			return;
		}

		const tasks = (this.options.tasks ?? []) as string[];

		if (tasks.length === 0) {
			this.printNoTasksFound();

			return;
		}

		this.reporter.onExecutionStart?.();

		await this.runTasks(tasks);

		this.reporter.onExecutionFinish?.();
	}

	async runTasks(tasks: string[]) {
		const context: Context = { env: process.env };

		for (const task of tasks) {
			await this.taskRunner.run(task, context);
		}
	}

	listTasks() {
		const tasks = taskRegistry.getAll();

		if (tasks.length === 0) {
			this.logger.log("No tasks found");

			return;
		}

		this.logger.log("Available tasks:");
		tasks.forEach((task) => {
			this.logger.log(`- ${task.name}`);
		});
	}

	printNoTasksFound() {
		this.logger.log("No tasks specified");
		this.listTasks();
	}

	async registerTask() {
		const configFile = resolve(process.cwd(), this.options.configPath);
		this.logger.info(`Resolved config file: ${configFile}`);

		if (!existsSync(configFile)) {
			throw new Error(`Config file not found: ${configFile}`);
		}

		const jiti = createJiti(import.meta.url, {
			interopDefault: true,
			extensions: [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]
		});

		await jiti.import(pathToFileURL(configFile).toString());
	}
}
