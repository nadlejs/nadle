import Process from "node:process";

import { Handlers } from "./handlers/index.js";
import { EventEmitter } from "./models/event-emitter.js";
import { DefaultReporter } from "./reporting/reporter.js";
import { TaskScheduler } from "./engine/task-scheduler.js";
import { taskRegistry } from "./registration/task-registry.js";
import { OptionsResolver } from "./options/options-resolver.js";
import { ExecutionTracker } from "./models/execution-tracker.js";
import { DefaultLogger } from "./interfaces/defaults/default-logger.js";
import { type NadleCLIOptions, type NadleResolvedOptions } from "./options/types.js";

export class Nadle {
	public static readonly version: string = "0.5.0"; // x-release-please-version

	public readonly logger = new DefaultLogger();
	public readonly taskRegistry = taskRegistry;
	public readonly taskScheduler = new TaskScheduler(this);
	public readonly executionTracker = new ExecutionTracker();
	public readonly eventEmitter = new EventEmitter([this.executionTracker, new DefaultReporter(this)]);

	#options: NadleResolvedOptions | undefined;

	public constructor(private readonly cliOptions: NadleCLIOptions) {}

	public async init(): Promise<this> {
		this.#options = await new OptionsResolver(this.logger, this.taskRegistry).resolve(this.cliOptions);
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

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			Process.exit((error as any).errorCode || 1);
		}
	}

	public get options(): NadleResolvedOptions {
		if (this.#options === undefined) {
			throw new Error("Can not access options before Nadle is initialized.");
		}

		return this.#options;
	}
}
