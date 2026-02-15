import type Stream from "node:stream";

import c from "tinyrainbow";

import { type Logger } from "../logger.js";
import { FileLogger } from "../../utilities/file-logger.js";
import { LogLevels, createNadleConsola, type InputLogObject, type SupportLogLevel } from "../../utilities/consola.js";
import { ERASE_DOWN, HIDE_CURSOR, CLEAR_SCREEN, CURSOR_TO_START, ERASE_SCROLLBACK } from "../../utilities/constants.js";

const l = new FileLogger("logger");

/**
 * Options for initializing the Nadle logger.
 */
interface LoggerOptions {
	/** Log level for output. */
	readonly logLevel?: SupportLogLevel;

	/** @internal True if running in a worker thread. */
	readonly isWorkerThread?: boolean;
}

/**
 * Nadle logger implementation.
 */
export class DefaultLogger implements Logger {
	private _clearScreenPending: string | undefined;
	private readonly consola = createNadleConsola();
	public readonly outputStream: NodeJS.WriteStream = process.stdout;
	public readonly errorStream: NodeJS.WriteStream = process.stderr;

	/**
	 * Initialize the logger with options.
	 * @param options - Logger options.
	 */
	public configure(options: LoggerOptions) {
		const { logLevel = "log", isWorkerThread = false } = options;
		this.consola.level = LogLevels[logLevel];

		if (this.outputStream.isTTY) {
			this.outputStream.write(HIDE_CURSOR);
		}

		if (!isWorkerThread) {
			this.debug(
				`Configured logger with Consola reporters: [${this.consola.options.reporters.map((reporter) => reporter.constructor.name).join(", ")}]`
			);
		}
	}

	/**
	 * Log a standard message.
	 */
	public log(message: InputLogObject | string, ...args: unknown[]): void {
		l.log("log", message, ...args);
		this._clearScreen();
		this.consola.log(message, ...args);
	}

	/**
	 * Log an error message.
	 */
	public error(message: InputLogObject | string, ...args: unknown[]): void {
		l.log("error", message, ...args);

		this._clearScreen();
		this.consola.error(message, ...args);
	}

	/**
	 * Log a warning message.
	 */
	public warn(message: InputLogObject | string, ...args: unknown[]): void {
		l.log("warn", message, ...args);

		this._clearScreen();
		this.consola.warn(message, ...args);
	}

	/**
	 * Log an info message.
	 */
	public info(message: InputLogObject | string, ...args: unknown[]): void {
		l.log("info", message, ...args);

		this._clearScreen();

		if (typeof message === "string") {
			this.consola.info(message, ...args);

			return;
		}

		const { tag, ...rest } = message;

		if (Object.keys(rest).length === 0) {
			this.consola.info(c.yellow(tag), ...args);

			return;
		}

		this.consola.info(rest, c.yellow(tag), ...args);
	}

	/**
	 * Log a debug message.
	 */
	public debug(message: InputLogObject | string, ...args: unknown[]): void {
		l.log("debug", message, ...args);

		this._clearScreen();

		if (typeof message === "string") {
			this.consola.debug(message, ...args);

			return;
		}

		const { tag, ...rest } = message;

		if (Object.keys(rest).length === 0) {
			this.consola.debug(c.yellow(tag), ...args);

			return;
		}

		this.consola.debug(rest, c.yellow(tag), ...args);
	}

	/**
	 * Clear the full screen and optionally print a message.
	 * @param message - Optional message to print after clearing.
	 */
	private clearFullScreen(message = ""): void {
		l.log("clearFullScreen");

		if (message) {
			this.consola.log(`${CLEAR_SCREEN}${ERASE_SCROLLBACK}${message}`);
		} else {
			(this.outputStream as Stream.Writable).write(`${CLEAR_SCREEN}${ERASE_SCROLLBACK}`);
		}
	}

	/**
	 * Clear the screen and optionally print a message.
	 * @param message - Message to print after clearing.
	 * @param force - If true, clear immediately.
	 */
	private clearScreen(message: string, force = false): void {
		l.log("clearScreen", { message });

		this._clearScreenPending = message;

		if (force) {
			this._clearScreen();
		}
	}

	/**
	 * Internal method to clear the screen if pending.
	 */
	private _clearScreen() {
		l.log("_clearScreen");

		if (this._clearScreenPending == null) {
			return;
		}

		const log = this._clearScreenPending;
		this._clearScreenPending = undefined;
		this.consola.log(`${CURSOR_TO_START}${ERASE_DOWN}${log}`);
	}

	/**
	 * Get the number of columns in the output stream.
	 * @returns Number of columns, or 80 if unavailable.
	 */
	public getColumns(): number {
		return "columns" in this.outputStream ? this.outputStream.columns : 80;
	}
}
