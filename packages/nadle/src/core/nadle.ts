import process from "node:process";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

import c from "tinyrainbow";
import { createJiti } from "jiti";

import { Logger } from "./logger.js";
import { VERSION } from "../version.js";
import { capitalize } from "./utils.js";
import { TaskPool } from "./task-pool.js";
import { UnnamedGroup } from "./constants.js";
import { type RegisteredTask } from "./types.js";
import { TaskScheduler } from "./task-scheduler.js";
import { type Reporter, DefaultReporter } from "./reporter.js";
import { resolveTask, formatSuggestions } from "./resolve-task.js";
import { taskRegistry, type TaskRegistry } from "./task-registry.js";
import { optionRegistry, OptionsResolver } from "./options/shared.js";
import { type NadleCLIOptions, type NadleResolvedOptions } from "./options/index.js";

export class Nadle {
	public readonly version = VERSION;

	public readonly logger: Logger;
	public readonly reporter: Reporter;
	public readonly registry: TaskRegistry = taskRegistry;

	private readonly optionsResolver: OptionsResolver;

	constructor(options: NadleCLIOptions) {
		this.optionsResolver = new OptionsResolver(options);
		this.logger = new Logger(options);
		this.reporter = new DefaultReporter(this);

		this.reporter.onInit?.();
	}

	async execute(tasks: string[]) {
		await this.registerTask();
		this.optionsResolver.addConfigFileOptions(optionRegistry.get());

		try {
			const resolvedTasks = this.resolveTasks(tasks);
			this.reporter.onExecutionStart?.();

			if (this.options.showConfig) {
				this.showConfig();
			} else if (this.options.list) {
				this.listTasks();
			} else if (this.options.dryRun) {
				this.dryRunTasks(resolvedTasks);
			} else {
				await this.runTasks(resolvedTasks);
			}
		} catch (error) {
			this.reporter.onExecutionFailed?.();
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

		const scheduler = new TaskScheduler({ nadle: this }, tasks);
		await new TaskPool(this, (taskName) => scheduler.getReadyTasks(taskName)).run();
	}

	private dryRunTasks(tasks: string[]) {
		if (tasks.length === 0) {
			this.printNoTasksFound();

			return;
		}

		const orderedTasks = new TaskScheduler({ nadle: this }, tasks).getOrderedTasks();

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

	showConfig() {
		this.logger.log(JSON.stringify(this.options, null, 2));
	}

	private resolveTasks(tasks: string[]) {
		const allTasks = this.registry.getAll().map(({ name }) => name);

		const resolvedTasks = tasks.map((task) => {
			const resolvedTask = resolveTask(task, allTasks);

			if (resolvedTask.result === undefined) {
				const message = `Task ${c.yellow(c.bold(task))} not found.${formatSuggestions(resolvedTask.suggestions.map((task) => c.yellow(c.bold(task))))}`;
				this.logger.error(message);
				throw new Error(message);
			}

			return resolvedTask.result;
		});

		this.logger.info(`Resolved tasks: [ ${resolvedTasks.join(", ")} ]`);

		return resolvedTasks;
	}

	computeTaskGroups(): [string, (RegisteredTask & { description?: string })[]][] {
		const tasksByGroup: Record<string, (RegisteredTask & { description?: string })[]> = {};

		for (const task of this.registry.getAll()) {
			const { description, group = UnnamedGroup } = task.configResolver({ context: { nadle: this } });

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
		const configFile = this.options.configPath;

		if (!this.options.isWorkerThread) {
			this.logger.log(c.dim(`Using config file from ${configFile}\n`));
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
