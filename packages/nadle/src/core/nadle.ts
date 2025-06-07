import process from "node:process";
import { pathToFileURL } from "node:url";

import c from "tinyrainbow";
import { createJiti } from "jiti";

import { Logger } from "./logger.js";
import { VERSION } from "../version.js";
import { capitalize } from "./utils.js";
import { TaskPool } from "./task-pool.js";
import { TaskScheduler } from "./task-scheduler.js";
import { RIGHT_ARROW, UnnamedGroup } from "./constants.js";
import { TaskStatus, type RegisteredTask } from "./types.js";
import { type Reporter, DefaultReporter } from "./reporter.js";
import { resolveTask, formatSuggestions } from "./resolve-task.js";
import { optionRegistry, OptionsResolver } from "./options/shared.js";
import { type NadleCLIOptions, type NadleResolvedOptions } from "./options/index.js";

console.log("@@@", import.meta.dirname);

class TaskRegistry {
	public readonly registry = new Map<string, RegisteredTask>();

	constructor(public id: number) {}

	register(name: string, task: RegisteredTask) {
		console.log(`registering task id = ${this.id}`, name, task);
		this.registry.set(name, task);
		console.log(`registeddd ${Array.from(this.registry.keys())}`);
	}

	has(name: string) {
		return this.registry.has(name);
	}

	getAll(): RegisteredTask[] {
		console.log(`getAll registeddd ${Array.from(this.registry.keys())}`);

		return [...this.registry.values()];
	}

	findByName(taskName: string): RegisteredTask | undefined {
		return this.registry.get(taskName);
	}

	getByName(taskName: string): RegisteredTask {
		const task = this.findByName(taskName);

		if (!task) {
			throw new Error(`Task ${c.bold(taskName)} not found`);
		}

		return task;
	}

	onTaskStart(name: string) {
		const task = this.getByName(name);

		task.status = TaskStatus.Running;
		task.result.startTime = Date.now();
	}

	onTaskFinish(name: string) {
		const task = this.getByName(name);

		task.status = TaskStatus.Finished;
		task.result.duration = Date.now() - (task.result.startTime ?? 0);
	}

	onTaskFailed(name: string) {
		const task = this.getByName(name);

		task.status = TaskStatus.Failed;
		task.result.duration = Date.now() - (task.result.startTime ?? 0);
	}

	onTasksScheduled(names: string[]) {
		for (const name of names) {
			this.getByName(name).status = TaskStatus.Scheduled;
		}
	}
}

let id = Date.now();
console.log("initalize taskRegistry", id);
export const taskRegistry = new TaskRegistry(id++);

export class Nadle {
	public readonly version = VERSION;

	public readonly logger: Logger;
	public readonly reporter: Reporter;
	public readonly registry = taskRegistry;

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
			this.reporter.onExecutionFailed?.(error);
			throw error;
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
		this.logger.log(JSON.stringify(this.options, null, 2));
	}

	private resolveTasks(tasks: string[]) {
		const allTasks = this.registry.getAll().map(({ name }) => name);
		console.log("@resolveTasks", this.registry.id, this.registry === taskRegistry, Array.from(taskRegistry.registry.keys()));

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
		const configFile = this.options.configPath;

		const jiti = createJiti(import.meta.url, {
			interopDefault: true,
			extensions: OptionsResolver.SUPPORT_EXTENSIONS.map((ext) => `.${ext}`)
		});

		console.log("before import");
		await jiti.import(pathToFileURL(configFile).toString());
		console.log("after import");
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
