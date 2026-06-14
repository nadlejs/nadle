import Process from "node:process";

import { getWorkspaceById, ROOT_WORKSPACE_ID, isRootWorkspaceId } from "@nadle/project-resolver";

import { Handlers } from "./handlers/index.js";
import { runWithInstance } from "./nadle-context.js";
import { EventEmitter } from "./models/event-emitter.js";
import { type Listener } from "./interfaces/listener.js";
import { DefaultReporter } from "./reporting/reporter.js";
import { TaskScheduler } from "./engine/task-scheduler.js";
import { AgentReporter } from "./reporting/agent-reporter.js";
import { PluginRegistry } from "./plugins/plugin-registry.js";
import { PluginListener } from "./plugins/plugin-listener.js";
import { TaskRegistry } from "./registration/task-registry.js";
import { OptionsResolver } from "./options/options-resolver.js";
import { type State, type ExecutionContext } from "./context.js";
import { ExecutionTracker } from "./models/execution-tracker.js";
import { type SchedulerTask } from "./engine/scheduler-types.js";
import { type TaskIdentifier } from "./models/task-identifier.js";
import { DefaultLogger } from "./interfaces/defaults/default-logger.js";
import { FileOptionRegistry } from "./registration/file-option-registry.js";
import { DefaultFileReader } from "./interfaces/defaults/default-file-reader.js";
import { type NadleCLIOptions, type NadleResolvedOptions } from "./options/types.js";
import { NadleError, ConfigurationError, TaskExecutionError, type StructuredError } from "./utilities/nadle-error.js";

/** Structure a non-NadleError failure: generic exit code 1 and the error's class name. */
function toStructuredError(error: unknown): StructuredError {
	return {
		errorCode: 1,
		errorType: error instanceof Error ? error.name : "Error",
		message: error instanceof Error ? error.message : String(error)
	};
}

/** A task name paired with its optional description, for shell completion menus. */
export interface TaskCompletion {
	readonly label: string;
	readonly description: string | undefined;
}

export class Nadle implements ExecutionContext {
	public static readonly version: string = "0.5.4"; // x-release-please-version

	public state: State = { selectingTasks: false };

	public readonly logger = new DefaultLogger();
	public readonly taskRegistry = new TaskRegistry();
	public readonly pluginRegistry = new PluginRegistry();
	public readonly fileOptionRegistry = new FileOptionRegistry();
	public readonly taskScheduler = new TaskScheduler(this);
	public readonly executionTracker = new ExecutionTracker();
	public readonly eventEmitter: EventEmitter = new EventEmitter([this.executionTracker]);

	#options: NadleResolvedOptions | undefined;

	public constructor(private readonly cliOptions: NadleCLIOptions) {}

	public async init(): Promise<this> {
		this.#options = await runWithInstance(this, () =>
			new OptionsResolver(this.logger, this.taskRegistry, this.fileOptionRegistry).resolve(this.cliOptions)
		);
		this.eventEmitter.addListener(this.resolveReporter());

		if (this.hasPluginHooks()) {
			this.eventEmitter.addListener(new PluginListener(this, this.pluginRegistry));
		}

		await this.eventEmitter.onInitialize();

		return this;
	}

	/**
	 * Resolves the project and loads config files to discover task labels and their
	 * descriptions, without attaching any reporter or emitting lifecycle events.
	 * Used by shell completion to surface descriptions alongside task names.
	 */
	public async getTaskCompletions(): Promise<TaskCompletion[]> {
		this.#options = await runWithInstance(this, () =>
			new OptionsResolver(this.logger, this.taskRegistry, this.fileOptionRegistry).resolve(this.cliOptions)
		);

		const byLabel = new Map<string, TaskCompletion>();

		for (const task of this.taskRegistry.tasks) {
			if (!byLabel.has(task.label)) {
				byLabel.set(task.label, { label: task.label, description: task.configResolver().description });
			}
		}

		return [...byLabel.values()].sort((a, b) => a.label.localeCompare(b.label));
	}

	private resolveReporter(): Listener {
		const name = this.options.reporter;

		if (name === "agent") {
			return new AgentReporter(this);
		}

		if (name === "default") {
			return new DefaultReporter(this);
		}

		const factory = this.pluginRegistry.getReporter(name);

		if (factory === undefined) {
			const available = ["default", "agent", ...this.pluginRegistry.getReporterNames()].join(", ");
			throw new ConfigurationError(`Unknown reporter "${name}". Available reporters: ${available}.`);
		}

		return factory(this);
	}

	private hasPluginHooks(): boolean {
		return this.pluginRegistry.getApplied().some(({ plugin }) => plugin.hooks !== undefined && Object.keys(plugin.hooks).length > 0);
	}

	public async initForWorker(resolvedOptions: NadleResolvedOptions): Promise<this> {
		this.#options = resolvedOptions;
		this.logger.configure(resolvedOptions);
		this.logger.debug("Worker init: loading config files (skipping project resolution)");

		await runWithInstance(this, () => this.loadConfigFiles(resolvedOptions));
		this.taskRegistry.configure(resolvedOptions.project);

		return this;
	}

	private async loadConfigFiles(resolvedOptions: NadleResolvedOptions) {
		const { project } = resolvedOptions;
		const fileReader = new DefaultFileReader();

		this.taskRegistry.onConfigureWorkspace(ROOT_WORKSPACE_ID);
		this.fileOptionRegistry.onConfigureWorkspace(ROOT_WORKSPACE_ID);
		await fileReader.read(project.rootWorkspace.configFilePath);

		for (const workspace of project.workspaces) {
			if (workspace.configFilePath) {
				this.taskRegistry.onConfigureWorkspace(workspace.id);
				this.fileOptionRegistry.onConfigureWorkspace(workspace.id);
				await fileReader.read(workspace.configFilePath);
			}
		}
	}

	public async execute() {
		try {
			await this.init();

			await this.eventEmitter.onExecutionStart();

			for (const Handler of Handlers) {
				const handler = new Handler(this);

				if (handler.canHandle()) {
					this.logger.debug("Executing handler:", handler.name);
					await handler.handle();

					break;
				}
			}

			await this.eventEmitter.onExecutionFinish();
		} catch (error) {
			// Resolution/configuration errors are raised before the reporter is attached, so
			// surface their message here; task-execution failures are reported by the reporter.
			if (error instanceof NadleError && !(error instanceof TaskExecutionError)) {
				this.logger.error(error.message);
			}

			if (this.isStructuredErrorMode()) {
				this.emitStructuredError(error);
			}

			await this.eventEmitter.onExecutionFailed(error);

			Process.exit(error instanceof NadleError ? error.errorCode : 1);
		}
	}

	/**
	 * Whether failures should additionally emit a machine-readable error record.
	 * Keyed off the resolved reporter (falling back to the requested CLI reporter
	 * when options aren't resolved yet), so a future explicit machine-output flag
	 * can plug in here without touching the catch block.
	 */
	private isStructuredErrorMode(): boolean {
		const reporter = this.#options?.reporter ?? this.cliOptions.reporter;

		return reporter === "agent";
	}

	private emitStructuredError(error: unknown): void {
		const structured: StructuredError = error instanceof NadleError ? error.toStructured() : toStructuredError(error);

		this.logger.errorStream.write(`${JSON.stringify(structured)}\n`);
	}

	public get options(): NadleResolvedOptions {
		if (this.#options === undefined) {
			throw new Error("Can not access options before Nadle is initialized.");
		}

		return this.#options;
	}

	public getTaskById(taskId: TaskIdentifier): SchedulerTask {
		return this.taskRegistry.getTaskById(taskId);
	}

	public getTasksByName(taskName: string): readonly SchedulerTask[] {
		return this.taskRegistry.getTaskByName(taskName);
	}

	public parseTaskRef(input: string, targetWorkspaceId: string): TaskIdentifier {
		return this.taskRegistry.parse(input, targetWorkspaceId);
	}

	public isRootWorkspace(workspaceId: string): boolean {
		return isRootWorkspaceId(workspaceId);
	}

	public getWorkspaceDependencies(workspaceId: string): readonly string[] {
		return getWorkspaceById(this.options.project, workspaceId).dependencies;
	}

	public updateState(updater: (state: State) => State): void {
		this.state = updater(this.state);
		this.logger.debug("Nadle state updated:", this.state);
	}
}
