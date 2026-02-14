import { type InputLogObject } from "../utilities/consola.js";

/**
 * Logger interface for Nadle.
 */
export interface Logger {
	/**
	 * Log a standard message.
	 * @param message - The message or log object.
	 * @param args - Additional arguments.
	 */
	log(message: InputLogObject | string, ...args: unknown[]): void;
	/**
	 * Log a warning message.
	 * @param message - The message or log object.
	 * @param args - Additional arguments.
	 */
	warn(message: InputLogObject | string, ...args: unknown[]): void;
	/**
	 * Log an info message.
	 * @param message - The message or log object.
	 * @param args - Additional arguments.
	 */
	info(message: InputLogObject | string, ...args: unknown[]): void;
	/**
	 * Log an error message.
	 * @param message - The message or log object.
	 * @param args - Additional arguments.
	 */
	error(message: InputLogObject | string, ...args: unknown[]): void;
	/**
	 * Log a debug message.
	 * @param message - The message or log object.
	 * @param args - Additional arguments.
	 */
	debug(message: InputLogObject | string, ...args: unknown[]): void;

	/**
	 * Log and throw a user-facing error (e.g. invalid config, missing task, cycle detected).
	 * For internal invariants / programmer errors, use `throw new Error()` directly instead.
	 * @param message - The message or log object.
	 * @param args - Additional arguments.
	 */
	throw(message: InputLogObject | string, ...args: unknown[]): never;

	/**
	 * Get the number of columns in the output stream.
	 * @returns Number of columns, or 80 if unavailable.
	 */
	getColumns(): number;
}
