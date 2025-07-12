import Process from "node:process";

import { Handlers } from "./handlers/index.js";
import { TaskScheduler } from "./engine/task-scheduler.js";
import { type FileReader } from "./interfaces/file-reader.js";
import { taskRegistry } from "./registration/task-registry.js";
import { OptionsResolver } from "./options/options-resolver.js";
import { ProjectResolver } from "./options/project-resolver.js";
import { type TaskIdentifier } from "./models/task-identifier.js";
import { RootWorkspace } from "./models/project/root-workspace.js";
import { TaskInputResolver } from "./options/task-input-resolver.js";
import { DefaultLogger } from "./interfaces/defaults/default-logger.js";
import { type Reporter, DefaultReporter } from "./reporting/reporter.js";
import { fileOptionRegistry } from "./registration/file-option-registry.js";
import { DefaultFileReader } from "./interfaces/defaults/default-file-reader.js";
import { TaskStatus, type RegisteredTask } from "./interfaces/registered-task.js";
import { type NadleCLIOptions, type NadleResolvedOptions } from "./options/types.js";

export class Nadle {
	public static readonly version: string = "0.4.0"; // x-release-please-version

	public readonly logger = new DefaultLogger();
	public readonly taskRegistry = taskRegistry;

	private readonly fileReader: FileReader = new DefaultFileReader();
	private readonly reporter: Reporter = new DefaultReporter(this);
	public readonly taskScheduler = new TaskScheduler(this);
	private readonly fileOptionRegistry = fileOptionRegistry;
	private readonly taskResolver = new TaskInputResolver(this.logger, this.taskRegistry.getTaskNameByWorkspace.bind(this.taskRegistry));

	#options: NadleResolvedOptions | undefined;

	// TODO: Can we remove this?
	public resolvedTasks: TaskIdentifier[] = [];
	public excludedTaskIds: TaskIdentifier[] = [];

	public constructor(private readonly cliOptions: NadleCLIOptions) {}

	public async init(): Promise<this> {
		const project = await new ProjectResolver().resolve(this.onInitializeWorkspace.bind(this), this.cliOptions.configFile);

		this.#options = await new OptionsResolver().resolve({
			project,
			cliOptions: this.cliOptions,
			fileOptions: this.fileOptionRegistry.get(RootWorkspace.ID)
		});

		this.logger.init(this.options);
		await this.reporter.init?.();

		this.taskRegistry.configure(this.options.project);
		this.excludedTaskIds = this.taskResolver.resolve(this.options.excludedTasks, this.options.project);

		return this;
	}

	public async execute(taskInputs: string[]) {
		await this.init();

		try {
			this.reporter.onExecutionStart?.();
			this.resolvedTasks = this.taskResolver.resolve(taskInputs, this.options.project).filter((task) => !this.excludedTaskIds.includes(task));

			for (const Handler of Handlers) {
				const handler = new Handler(this);

				if (handler.canHandle()) {
					this.logger.debug("Executing handler:", handler.name);
					await handler.handle();

					break;
				}
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

	public printNoTasksSpecified() {
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
