import process from "node:process";
import { pathToFileURL } from "node:url";

import c from "tinyrainbow";
import { createJiti } from "jiti";

import { VERSION } from "../../version.js";
import { TaskPool } from "../engine/task-pool.js";
import { Logger } from "../presentation/logger.js";
import { capitalize } from "../utilities/utils.js";
import { type RegisteredTask } from "../interfaces/task.js";
import { RIGHT_ARROW, UnnamedGroup } from "../constants.js";
import { TaskScheduler } from "../scheduling/task-scheduler.js";
import { configsRegistry } from "../configuration/configs-registry.js";
import { ConfigsResolver } from "../configuration/configs-resolver.js";
import { resolveTask, formatSuggestions } from "../task/resolve-task.js";
import { taskRegistry, type TaskRegistry } from "../task/task-registry.js";
import { type Reporter, DefaultReporter } from "../presentation/reporter.js";
import { type NadleCLIConfigurations, type NadleResolvedConfigurations } from "../configuration/types.js";

export class Nadle {
	public readonly version = VERSION;

	public readonly logger: Logger;
	public readonly reporter: Reporter;
	public readonly registry: TaskRegistry = taskRegistry;

	private readonly configsResolver: ConfigsResolver;

	constructor(configs: NadleCLIConfigurations) {
		this.configsResolver = new ConfigsResolver(configs);
		this.logger = new Logger(configs);
		this.reporter = new DefaultReporter(this);

		this.reporter.onInit?.();
	}

	async execute(tasks: string[]) {
		await this.registerTask();
		this.configsResolver.addConfigFileConfigs(configsRegistry.get());

		try {
			const resolvedTasks = this.resolveTasks(tasks);
			this.reporter.onExecutionStart?.();

			if (this.configs.showConfig) {
				this.showConfig();
			} else if (this.configs.list) {
				this.listTasks();
			} else if (this.configs.dryRun) {
				this.dryRunTasks(resolvedTasks);
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

	get configs(): NadleResolvedConfigurations {
		return this.configsResolver.configs;
	}

	private async runTasks(tasks: string[]) {
		if (tasks.length === 0) {
			this.printNoTasksFound();

			return;
		}

		const scheduler = new TaskScheduler({ nadle: this }, tasks);
		await this.onTasksScheduled(scheduler.scheduledTask);

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

	showConfig() {
		this.logger.log(JSON.stringify(this.configs, null, 2));
	}

	private resolveTasks(tasks: string[]) {
		const allTasks = this.registry.getAll().map(({ name }) => name);

		const resolveTaskPairs: { resolved: string; original: string }[] = [];

		const resolvedTasks = tasks.map((task) => {
			const resolvedTask = resolveTask(task, allTasks);

			if (resolvedTask.result === undefined) {
				const message = `Task ${c.yellow(c.bold(task))} not found.${formatSuggestions(resolvedTask.suggestions.map((task) => c.yellow(c.bold(task))))}`;
				this.logger.error(message);
				throw new Error(message);
			}

			if (resolvedTask.result !== task) {
				resolveTaskPairs.push({ original: task, resolved: resolvedTask.result });
			}

			return resolvedTask.result;
		});

		if (resolveTaskPairs.length > 0) {
			const maxOriginTaskLength = Math.max(...resolveTaskPairs.map(({ original }) => original?.length ?? 0));
			const message = [
				`Resolved tasks:\n`,
				...resolveTaskPairs.map(
					({ resolved, original }) =>
						`${" ".repeat(4)}${c.yellow(c.bold(original?.padEnd(maxOriginTaskLength, " ")))}  ${RIGHT_ARROW} ${c.green(c.bold(resolved))}\n`
				)
			].join("");
			this.logger.log(message);
		}

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
		const configFile = this.configs.configPath;

		const jiti = createJiti(import.meta.url, {
			interopDefault: true,
			extensions: ConfigsResolver.SUPPORT_EXTENSIONS.map((ext) => `.${ext}`)
		});

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

	public async onTaskFailed(task: RegisteredTask) {
		this.registry.onTaskFailed(task.name);
		await this.reporter.onTaskFailed?.(task);
	}

	public async onTasksScheduled(tasks: string[]) {
		this.registry.onTasksScheduled(tasks);
		await this.reporter.onTasksScheduled?.(tasks);
	}
}
