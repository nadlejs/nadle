/**
 * Error class for Nadle with a typed exit code.
 *
 * @public
 */
export class NadleError extends Error {
	/**
	 * The process exit code to use when this error is caught at the top level.
	 */
	public readonly errorCode: number;

	public constructor(message: string, errorCode: number = 1, options?: ErrorOptions) {
		super(message, options);
		this.name = "NadleError";
		this.errorCode = errorCode;
	}
}

/**
 * Thrown when configuration is invalid or cannot be loaded — a missing or
 * malformed config file, invalid options, or invalid task inputs.
 *
 * @public
 */
export class ConfigurationError extends NadleError {
	public constructor(message: string) {
		super(message, 2);
		this.name = "ConfigurationError";
	}
}

/**
 * Thrown when a requested task cannot be resolved within the project.
 *
 * @public
 */
export class TaskNotFoundError extends NadleError {
	public constructor(message: string) {
		super(message, 3);
		this.name = "TaskNotFoundError";
	}
}

/**
 * Thrown when the task graph contains a cyclic dependency.
 *
 * @public
 */
export class CyclicDependencyError extends NadleError {
	public constructor(message: string) {
		super(message, 4);
		this.name = "CyclicDependencyError";
	}
}

/**
 * Thrown when a task fails during execution.
 *
 * @public
 */
export class TaskExecutionError extends NadleError {
	public constructor(message: string, options?: ErrorOptions) {
		// Keeps the generic exit code 1 — a failing task is the baseline failure
		// mode and changing its exit code would break existing CLI contracts.
		super(message, 1, options);
		this.name = "TaskExecutionError";
	}
}
