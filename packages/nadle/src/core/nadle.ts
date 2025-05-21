import process from "node:process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

import c from "tinyrainbow";
import { isCI } from "std-env";
import { createJiti } from "jiti";

import { VERSION } from "../version.js";
import { capitalize } from "./utils.js";
import { TaskPool } from "./task-pool.js";
import { UnnamedGroup } from "./constants.js";
import { type RegisteredTask } from "./types.js";
import { TaskScheduler } from "./task-scheduler.js";
import { Logger, type SupportLogLevel } from "./logger.js";
import { type Reporter, DefaultReporter } from "./reporter.js";
import { taskRegistry, type TaskRegistry } from "./task-registry.js";

export interface NadleUserOptions {
	readonly tasks?: string[];

	readonly configPath: string;

	readonly list?: boolean;
	readonly dryRun?: boolean;
	readonly showSummary?: boolean;
	readonly logLevel: SupportLogLevel;
	readonly minWorkers?: number | string;
	readonly maxWorkers?: number | string;

	/** @internal */
	readonly isWorkerThread?: boolean;
}

export type NadleOptions = Required<Omit<NadleUserOptions, "maxWorkers" | "minWorkers">> & Pick<NadleUserOptions, "maxWorkers" | "minWorkers">;

export class Nadle {
	public readonly logger: Logger;
	public readonly reporter: Reporter;
	public readonly registry: TaskRegistry = taskRegistry;
	public readonly options: NadleOptions;
	public readonly version = VERSION;

	constructor(options: NadleUserOptions) {
		this.options = this.resolveOptions(options);
		this.logger = new Logger(options);
		this.reporter = new DefaultReporter(this);

		this.reporter.onInit?.();
	}

	private resolveOptions(options: NadleUserOptions): NadleOptions {
		return {
			tasks: [],
			list: false,
			dryRun: false,
			showSummary: !isCI,
			isWorkerThread: false,
			...options
		};
	}

	async execute() {
		await this.registerTask();
		this.reporter.onExecutionStart?.();

		try {
			if (this.options.list) {
				this.listTasks();
			} else if (this.options.dryRun) {
				this.dryRunTasks();
			} else {
				await this.runTasks();
			}
		} catch (error) {
			this.reporter.onExecutionFailed?.();
			// eslint-disable-next-line n/no-process-exit,@typescript-eslint/no-explicit-any
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

		const scheduler = new TaskScheduler({ nadle: this, env: process.env }, tasks);
		await new TaskPool(this, (taskName) => scheduler.getReadyTasks(taskName)).run();
	}

	dryRunTasks() {
		const tasks = this.options.tasks ?? [];

		if (tasks.length === 0) {
			this.printNoTasksFound();

			return;
		}

		const orderedTasks = new TaskScheduler({ nadle: this, env: process.env }, tasks).getOrderedTasks();

		this.logger.log(c.bold("Execution plan:"));

		for (const task of orderedTasks) {
			this.logger.log(`${c.yellow(">")} Task ${c.bold(task)}`);
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

		if (!this.options.isWorkerThread) {
			this.logger.log(`${c.gray("Using config file from")} ${c.dim(configFile)}\n`);
		}

		if (!existsSync(configFile)) {
			throw new Error(`Config file not found: ${configFile}`);
		}

		const jiti = createJiti(import.meta.url, { interopDefault: true, extensions: [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"] });

		await jiti.import(pathToFileURL(configFile).toString());
	}

	public async onTaskStart(task: RegisteredTask) {
		this.registry.onTaskStart(task.name);
		await this.reporter.onTaskStart?.(task);
	}

	public async onTaskFinish(task: RegisteredTask) {
		this.registry.onTaskFinish(task.name);
		await this.reporter.onTaskFinish?.(task);
	}

	public async onTaskFailed(task: RegisteredTask) {
		this.registry.onTaskFailed(task.name);
		await this.reporter.onTaskFailed?.(task);
	}

	public async onTaskQueued(task: RegisteredTask) {
		this.registry.onTaskQueued(task.name);
		await this.reporter.onTaskQueued?.(task);
	}
}
