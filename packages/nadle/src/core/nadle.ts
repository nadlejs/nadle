import Fs from "node:fs/promises";
import Process from "node:process";

import c from "tinyrainbow";

import { Logger } from "./reporting/logger.js";
import { Project } from "./options/project.js";
import { DASH } from "./utilities/constants.js";
import { TaskPool } from "./engine/task-pool.js";
import { capitalize } from "./utilities/utils.js";
import { FileReader } from "./utilities/file-reader.js";
import { TaskResolver } from "./options/task-resolver.js";
import { TaskScheduler } from "./engine/task-scheduler.js";
import { taskRegistry } from "./registration/task-registry.js";
import { OptionsResolver } from "./options/options-resolver.js";
import { ProjectResolver } from "./options/project-resolver.js";
import { renderTaskSelection } from "./views/tasks-selection.js";
import { type TaskIdentifier } from "./registration/task-identifier.js";
import { type Reporter, DefaultReporter } from "./reporting/reporter.js";
import { TaskStatus, type RegisteredTask } from "./registration/types.js";
import { fileOptionRegistry } from "./registration/file-option-registry.js";
import { type NadleCLIOptions, type NadleResolvedOptions } from "./options/types.js";

export class Nadle {
	public static readonly version: string = "0.4.0"; // x-release-please-version

	public readonly logger = new Logger();
	public readonly taskRegistry = taskRegistry;

	private readonly fileReader = new FileReader();
	private readonly reporter: Reporter = new DefaultReporter(this);
	private readonly taskScheduler = new TaskScheduler(this);
	private readonly fileOptionRegistry = fileOptionRegistry;
	private readonly taskResolver = new TaskResolver(this.logger, this.taskRegistry);

	#options: NadleResolvedOptions | undefined;

	private static readonly UnnamedGroup = "Unnamed";

	// TODO: Can we remove this?
	public resolvedTasks: TaskIdentifier[] = [];
	public excludedTaskIds: TaskIdentifier[] = [];

	public constructor(private readonly cliOptions: NadleCLIOptions) {}

	public async init(): Promise<this> {
		const optionsResolver = new OptionsResolver();

		const project = await new ProjectResolver().resolve(optionsResolver.cwd, this.cliOptions.configFile, this.onInitializeWorkspace.bind(this));

		// Add this point, the options and tasks from root workspace's configuration file are registered
		this.#options = await optionsResolver.resolve({
			project,
			cliOptions: this.cliOptions,
			fileOptions: this.fileOptionRegistry.get(Project.ROOT_WORKSPACE_ID)
		});

		this.logger.init(this.options);
		await this.reporter.init?.();

		this.taskRegistry.configure(this.options.project);

		this.excludedTaskIds = this.options.excludedTasks.map((excludedTaskInput) => this.taskRegistry.parse(excludedTaskInput));

		return this;
	}

	public async execute(taskInputs: string[]) {
		await this.init();

		try {
			this.reporter.onExecutionStart?.();
			this.resolvedTasks = this.taskResolver.resolve(taskInputs).filter((task) => !this.excludedTaskIds.includes(task));

			if (this.options.showConfig) {
				this.showConfig();
			} else if (this.options.list) {
				this.listTasks();
			} else if (this.options.dryRun) {
				this.dryRunTasks();
			} else if (this.options.cleanCache) {
				await this.cleanCache();
			} else {
				await this.runTasks();
			}
		} catch (error) {
			this.reporter.onExecutionFailed?.(error);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			Process.exit((error as any).errorCode || 1);
		}

		this.reporter.onExecutionFinish?.();
	}

	public get options(): NadleResolvedOptions {
		if (this.#options === undefined) {
			throw new Error("Nadle options are not initialized. Please call init() before accessing options.");
		}

		return this.#options;
	}

	private async runTasks() {
		let chosenTasks: string[] = this.resolvedTasks;

		if (chosenTasks.length === 0) {
			chosenTasks = await renderTaskSelection(this.taskRegistry);

			if (chosenTasks.length === 0) {
				this.printNoTasksSpecified();

				return;
			}
		}

		const scheduler = this.taskScheduler.init(chosenTasks);
		await this.onTasksScheduled(scheduler.scheduledTask);

		await new TaskPool(this, (taskId) => scheduler.getReadyTasks(taskId)).run();
	}

	private dryRunTasks() {
		if (this.resolvedTasks.length === 0) {
			this.printNoTasksSpecified();

			return;
		}

		const taskIds = new TaskScheduler(this).init(this.resolvedTasks).getOrderedTasks();

		this.logger.log(c.bold("Execution plan:"));

		for (const taskId of taskIds) {
			this.logger.log(`${c.yellow(">")} Task ${c.bold(this.taskRegistry.getById(taskId).label)}`);
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
			this.logger.log(c.bold(DASH.repeat(label.length)));

			for (const task of tasks) {
				const { label, description } = task;

				if (description) {
					this.logger.log(c.bold(c.green(label)) + c.yellow(` - ${description}`));
				} else {
					this.logger.log(c.green(label));
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

		for (const task of this.taskRegistry.getAll()) {
			const { description, group = Nadle.UnnamedGroup } = task.configResolver();

			tasksByGroup[group] ??= [];
			tasksByGroup[group].push({ ...task, description });
		}

		return Object.entries(tasksByGroup)
			.sort(([firstGroupName], [secondGroupName]) => {
				if (firstGroupName === Nadle.UnnamedGroup) {
					return 1;
				}

				if (secondGroupName === Nadle.UnnamedGroup) {
					return -1;
				}

				return firstGroupName.localeCompare(secondGroupName);
			})
			.map(([groupName, tasks]) => {
				return [groupName, tasks.sort((firstTask, secondTask) => firstTask.id.localeCompare(secondTask.id))];
			});
	}

	private printNoTasksSpecified() {
		this.logger.log("No tasks were specified. Please specify one or more tasks to execute, or use the --list option to view available tasks.");
	}

	private async onInitializeWorkspace(workspaceId: string, configFilePath: string) {
		this.taskRegistry.onInitializeWorkspace(workspaceId);
		this.fileOptionRegistry.onInitializeWorkspace(workspaceId);

		await this.fileReader.read(configFilePath);
	}

	public async onTaskStart(task: RegisteredTask, threadId: number) {
		this.taskRegistry.onTaskStart(task.id);
		await this.reporter.onTaskStart?.(task, threadId);
	}

	public async onTaskFinish(task: RegisteredTask) {
		this.taskRegistry.onTaskFinish(task.id);
		await this.reporter.onTaskFinish?.(task);
	}
	public async onTaskUpToDate(task: RegisteredTask) {
		this.taskRegistry.onTaskUpToDate(task.id);
		await this.reporter.onTaskUpToDate?.(task);
	}

	public async onTaskRestoreFromCache(task: RegisteredTask) {
		this.taskRegistry.onTaskRestoreFromCache(task.id);
		await this.reporter.onTaskRestoreFromCache?.(task);
	}

	public async onTaskFailed(task: RegisteredTask) {
		this.taskRegistry.onTaskFailed(task.id);
		await this.reporter.onTaskFailed?.(task);
	}

	public async onTaskCanceled(task: RegisteredTask) {
		if (task.status === TaskStatus.Running) {
			this.taskRegistry.onTaskCanceled(task.id);
			await this.reporter.onTaskCanceled?.(task);
		}
	}

	public async onTasksScheduled(tasks: string[]) {
		this.taskRegistry.onTasksScheduled(tasks);
		await this.reporter.onTasksScheduled?.(tasks);
	}
}
