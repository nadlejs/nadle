import { type Logger } from "./logger.js";
import { type Callback, type Awaitable } from "../utilities/index.js";

/**
 * Interface for a typed task with options.
 * @template Options The options type for the task.
 */
export interface Task<Options = unknown> {
	/**
	 * The function to run for this task.
	 * @param options - Task options.
	 * @param context - Runner context.
	 */
	run: Callback<Awaitable<void>, { options: Options; context: RunnerContext }>;
}

/**
 * Context object passed to task runners.
 */
export interface RunnerContext {
	/** Logger instance for reporting. */
	readonly logger: Logger;
	/** The working directory for the task. */
	readonly workingDir: string;
}
