import process from "node:process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

import c from "tinyrainbow";
import { createJiti } from "jiti";

import { capitalize } from "./utils.js";
import { TaskRunner } from "./task-runner.js";
import { UnnamedGroup } from "./constants.js";
import { taskRegistry } from "./task-registry.js";
import { Logger, type SupportLogLevel } from "./logger.js";
import { type Context, type RegisteredTask } from "./types.js";
import { type Reporter, DefaultReporter } from "./reporter.js";

export interface NadleOptions {
	readonly tasks?: string[];

	readonly configPath: string;

	readonly list?: boolean;
	readonly showSummary: boolean;
	readonly logLevel: SupportLogLevel;
}

export class Nadle {
	public readonly logger: Logger;
	public readonly reporter: Reporter;
	public readonly taskRunner: TaskRunner;
	public readonly registry = taskRegistry;

	constructor(public readonly options: NadleOptions) {
		this.logger = new Logger(options.logLevel);
		this.taskRunner = new TaskRunner(this);
		this.reporter = new DefaultReporter(this);

		this.reporter.onInit?.(this);
	}

	async execute() {
		await this.registerTask();
		this.reporter.onExecutionStart?.();

		try {
			if (this.options.list) {
				this.listTasks();
			} else {
				await this.runTasks();
			}
		} catch (error) {
			this.reporter.onExecutionFailed?.();
			// eslint-disable-next-line n/no-process-exit
			process.exit((error as any).errorCode || 1);
		}

		this.reporter.onExecutionFinish?.();
	}

	async runTasks() {
		const tasks = this.options.tasks ?? [];

		if (tasks.length === 0) {
			this.printNoTasksFound();

			return;
		}

		const context: Context = { nadle: this, env: process.env };

		for (const task of tasks) {
			await this.taskRunner.run(task, context);
		}
	}

	listTasks() {
		if (taskRegistry.getAll().length === 0) {
			this.logger.log("No tasks found");

			return;
		}

		const groups = this.computeTaskGroups();

		for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
			const [groupName, tasks] = groups[groupIndex];

			const label = `${capitalize(groupName)} tasks`;
			this.logger.log(c.bold(label));
			this.logger.log(c.bold("-".repeat(label.length)));

			for (const task of tasks) {
				const { description, name: taskName } = task;

				if (description) {
					this.logger.log(`${c.bold(c.green(taskName))}${c.yellow(` - ${description}`)}`);
				} else {
					this.logger.log(`${c.green(taskName)}`);
				}
			}

			if (groupIndex < groups.length - 1) {
				this.logger.log("");
			}
		}
	}

	computeTaskGroups(): [string, (RegisteredTask & { description?: string })[]][] {
		const tasksByGroup: Record<string, (RegisteredTask & { description?: string })[]> = {};

		for (const task of this.registry.getAll()) {
			const { description, group = UnnamedGroup } = task.configResolver({ context: { nadle: this, env: process.env } });

			tasksByGroup[group] ??= [];
			tasksByGroup[group].push({ ...task, description });
		}

		return Object.entries(tasksByGroup)
			.sort(([firstGroupName], [secondGroupName]) => {
				if (firstGroupName === UnnamedGroup) {
					return 1;
				}

				if (secondGroupName === UnnamedGroup) {
					return -1;
				}

				return firstGroupName.localeCompare(secondGroupName);
			})
			.map(([groupName, tasks]) => {
				return [groupName, tasks.sort((firstTask, secondTask) => firstTask.name.localeCompare(secondTask.name))];
			});
	}

	printNoTasksFound() {
		this.logger.log("No tasks were specified. Please specify one or more tasks to execute, or use the --list option to view available tasks.");
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
