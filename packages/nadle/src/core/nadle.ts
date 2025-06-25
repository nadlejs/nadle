import Fs from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

import c from "tinyrainbow";
import { createJiti } from "jiti";

import { Logger } from "./logger.js";
import { capitalize } from "./utils.js";
import { TaskPool } from "./task-pool.js";
import { UnnamedGroup } from "./constants.js";
import { type RegisteredTask } from "./types.js";
import { TaskResolver } from "./resolve-task.js";
import { TaskScheduler } from "./task-scheduler.js";
import { type Reporter, DefaultReporter } from "./reporter.js";
import { taskRegistry, type TaskRegistry } from "./task-registry.js";
import { optionRegistry, OptionsResolver } from "./options/shared.js";
import { type NadleCLIOptions, type NadleResolvedOptions } from "./options/types.js";

export class Nadle {
	public static readonly version: string = "0.3.7"; // x-release-please-version

	public readonly logger: Logger;
	public readonly reporter: Reporter;
	public readonly registry: TaskRegistry = taskRegistry;
	public readonly taskResolver: TaskResolver;

	private readonly optionsResolver: OptionsResolver;

	constructor(options: NadleCLIOptions) {
		this.logger = new Logger(options);
		this.taskResolver = new TaskResolver(this.logger);
		this.optionsResolver = new OptionsResolver(options, this.taskResolver, this.registry);
		this.reporter = new DefaultReporter(this);
	}

	async execute(tasks: string[]) {
		await this.registerTask();
		this.optionsResolver.addConfigFileOptions(optionRegistry.get());
		this.logger.updateLogLevel(this.options.logLevel);

		try {
			this.reporter.onExecutionStart?.();
			const resolvedTasks = this.taskResolver
				.resolve(tasks, this.registry.getAllByName())
				.filter((task) => !this.options.excludedTasks.includes(task));

			if (this.options.showConfig) {
				this.showConfig();
			} else if (this.options.list) {
				this.listTasks();
			} else if (this.options.dryRun) {
				this.dryRunTasks(resolvedTasks);
			} else if (this.options.cleanCache) {
				await this.cleanCache();
			} else {
				await this.runTasks(resolvedTasks);
			}
		} catch (error) {
			this.reporter.onExecutionFailed?.(error);
			// eslint-disable-next-line n/no-process-exit,@typescript-eslint/no-explicit-any
			process.exit((error as any).errorCode || 1);
		}

		this.reporter.onExecutionFinish?.();
	}

	get options(): NadleResolvedOptions {
		return this.optionsResolver.options;
	}

	private async runTasks(tasks: string[]) {
		if (tasks.length === 0) {
			this.printNoTasksFound();

			return;
		}

		const scheduler = new TaskScheduler(tasks, { nadle: this });
		await this.onTasksScheduled(scheduler.scheduledTask);

		await new TaskPool(this, (taskName) => scheduler.getReadyTasks(taskName)).run();
	}

	private dryRunTasks(tasks: string[]) {
		if (tasks.length === 0) {
			this.printNoTasksFound();

			return;
		}

		const orderedTasks = new TaskScheduler(tasks, { nadle: this }).getOrderedTasks();

		this.logger.log(c.bold("Execution plan:"));

		for (const task of orderedTasks) {
			this.logger.log(`${c.yellow(">")} Task ${c.bold(task)}`);
		}
	}

	private listTasks() {
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
					this.logger.log(c.bold(c.green(taskName)) + c.yellow(` - ${description}`));
				} else {
					this.logger.log(c.green(taskName));
				}
			}

			if (groupIndex < groups.length - 1) {
				this.logger.log("");
			}
		}
	}

	private showConfig() {
		this.logger.log(JSON.stringify(this.options, null, 2));
	}

	private async cleanCache() {
		try {
			this.logger.log(`Cleaning cache at ${this.options.cacheDir}...`);
			await Fs.rm(this.options.cacheDir, { force: true, recursive: true });
		} catch (error) {
			this.logger.error(`Failed to clean cache at ${this.options.cacheDir}:`, error);
			throw error;
		}
	}

	private computeTaskGroups(): [string, (RegisteredTask & { description?: string })[]][] {
		const tasksByGroup: Record<string, (RegisteredTask & { description?: string })[]> = {};

		for (const task of this.registry.getAll()) {
			const { description, group = UnnamedGroup } = task.configResolver();

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

	private printNoTasksFound() {
		this.logger.log("No tasks were specified. Please specify one or more tasks to execute, or use the --list option to view available tasks.");
	}

	async registerTask() {
		const configFile = this.options.configPath;

		const jiti = createJiti(import.meta.url, { interopDefault: true, extensions: OptionsResolver.SUPPORT_EXTENSIONS.map((ext) => `.${ext}`) });

		await jiti.import(pathToFileURL(configFile).toString());
	}

	public async onTaskStart(task: RegisteredTask, threadId: number) {
		this.registry.onTaskStart(task.name);
		await this.reporter.onTaskStart?.(task, threadId);
	}

	public async onTaskFinish(task: RegisteredTask) {
		this.registry.onTaskFinish(task.name);
		await this.reporter.onTaskFinish?.(task);
	}
	public async onTaskUpToDate(task: RegisteredTask) {
		this.registry.onTaskUpToDate(task.name);
		await this.reporter.onTaskUpToDate?.(task);
	}

	public async onTaskRestoreFromCache(task: RegisteredTask) {
		this.registry.onTaskRestoreFromCache(task.name);
		await this.reporter.onTaskRestoreFromCache?.(task);
	}

	public async onTaskFailed(task: RegisteredTask) {
		this.registry.onTaskFailed(task.name);
		await this.reporter.onTaskFailed?.(task);
	}

	public async onTasksScheduled(tasks: string[]) {
		this.registry.onTasksScheduled(tasks);
		await this.reporter.onTasksScheduled?.(tasks);
	}
}
