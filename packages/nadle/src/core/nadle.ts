import Process from "node:process";

import { Handlers } from "./handlers/index.js";
import { type Listener } from "./interfaces/listener.js";
import { EventEmitter } from "./models/event-emitter.js";
import { DefaultReporter } from "./reporting/reporter.js";
import { TaskScheduler } from "./engine/task-scheduler.js";
import { type FileReader } from "./interfaces/file-reader.js";
import { taskRegistry } from "./registration/task-registry.js";
import { OptionsResolver } from "./options/options-resolver.js";
import { ProjectResolver } from "./options/project-resolver.js";
import { ExecutionTracker } from "./models/execution-tracker.js";
import { type TaskIdentifier } from "./models/task-identifier.js";
import { RootWorkspace } from "./models/project/root-workspace.js";
import { TaskInputResolver } from "./options/task-input-resolver.js";
import { DefaultLogger } from "./interfaces/defaults/default-logger.js";
import { fileOptionRegistry } from "./registration/file-option-registry.js";
import { DefaultFileReader } from "./interfaces/defaults/default-file-reader.js";
import { type NadleCLIOptions, type NadleResolvedOptions } from "./options/types.js";

export class Nadle implements Listener {
	public static readonly version: string = "0.4.0"; // x-release-please-version

	public readonly logger = new DefaultLogger();
	public readonly taskRegistry = taskRegistry;
	public readonly taskScheduler = new TaskScheduler(this);
	public readonly executionTracker = new ExecutionTracker();
	public readonly eventEmitter = new EventEmitter([this.executionTracker, new DefaultReporter(this)]);

	private readonly fileReader: FileReader = new DefaultFileReader();
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

		await this.eventEmitter.init?.();

		this.taskRegistry.configure(this.options.project);
		this.excludedTaskIds = this.taskResolver.resolve(this.options.excludedTasks, this.options.project);

		return this;
	}

	public async execute(taskInputs: string[]) {
		await this.init();

		try {
			await this.eventEmitter.onExecutionStart();
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
			await this.eventEmitter.onExecutionFailed(error);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			Process.exit((error as any).errorCode || 1);
		}

		await this.eventEmitter.onExecutionFinish();
	}

	public get options(): NadleResolvedOptions {
		if (this.#options === undefined) {
			throw new Error("Nadle options are not initialized. Please call init() before accessing options.");
		}

		return this.#options;
	}

	private async onInitializeWorkspace(workspaceId: string, configFilePath: string) {
		this.taskRegistry.onInitializeWorkspace(workspaceId);
		this.fileOptionRegistry.onInitializeWorkspace(workspaceId);

		await this.fileReader.read(configFilePath);
	}

	public printNoTasksSpecified() {
		this.logger.log("No tasks were specified. Please specify one or more tasks to execute, or use the --list option to view available tasks.");
	}
}
