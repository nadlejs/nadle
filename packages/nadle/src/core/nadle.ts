import Process from "node:process";

import { Handlers } from "./handlers/index.js";
import { runWithInstance } from "./nadle-context.js";
import { NadleError } from "./utilities/nadle-error.js";
import { EventEmitter } from "./models/event-emitter.js";
import { DefaultReporter } from "./reporting/reporter.js";
import { TaskScheduler } from "./engine/task-scheduler.js";
import { TaskRegistry } from "./registration/task-registry.js";
import { OptionsResolver } from "./options/options-resolver.js";
import { type State, type ExecutionContext } from "./context.js";
import { ExecutionTracker } from "./models/execution-tracker.js";
import { DefaultLogger } from "./interfaces/defaults/default-logger.js";
import { FileOptionRegistry } from "./registration/file-option-registry.js";
import { type NadleCLIOptions, type NadleResolvedOptions } from "./options/types.js";

export class Nadle implements ExecutionContext {
	public static readonly version: string = "0.5.1"; // x-release-please-version

	public state: State = { selectingTasks: false };

	public readonly logger = new DefaultLogger();
	public readonly taskRegistry = new TaskRegistry();
	public readonly fileOptionRegistry = new FileOptionRegistry();
	public readonly taskScheduler = new TaskScheduler(this);
	public readonly executionTracker = new ExecutionTracker();
	public readonly eventEmitter: EventEmitter = new EventEmitter([this.executionTracker, new DefaultReporter(this)]);

	#options: NadleResolvedOptions | undefined;

	public constructor(private readonly cliOptions: NadleCLIOptions) {}

	public async init(): Promise<this> {
		this.#options = await runWithInstance(this, () =>
			new OptionsResolver(this.logger, this.taskRegistry, this.fileOptionRegistry).resolve(this.cliOptions)
		);
		await this.eventEmitter.onInitialize();

		return this;
	}

	public async execute() {
		await this.init();

		try {
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
			await this.eventEmitter.onExecutionFailed(error);

			Process.exit(error instanceof NadleError ? error.errorCode : 1);
		}
	}

	public get options(): NadleResolvedOptions {
		if (this.#options === undefined) {
			throw new Error("Can not access options before Nadle is initialized.");
		}

		return this.#options;
	}

	public updateState(updater: (state: State) => State): void {
		this.state = updater(this.state);
		this.logger.debug("Nadle state updated:", this.state);
	}
}
