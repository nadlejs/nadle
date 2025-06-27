import type { Writable } from "node:stream";

import c from "tinyrainbow";
// eslint-disable-next-line no-restricted-imports
import { type InputLogObject } from "consola";

import { FileLogger } from "./file-logger.js";
import { LogLevels, type LogType, createNadleConsola } from "./consola-reporters.js";
import { ERASE_DOWN, HIDE_CURSOR, CLEAR_SCREEN, CURSOR_TO_START, ERASE_SCROLLBACK } from "../utilities/constants.js";

export const SupportLogLevels = ["error", "log", "info", "debug"] as const satisfies LogType[];
export type SupportLogLevel = (typeof SupportLogLevels)[number];

const l = new FileLogger("logger");

interface LoggerOptions {
	readonly logLevel?: SupportLogLevel;

	/** @internal */
	readonly isWorkerThread?: boolean;
}

export interface ILogger {
	log(message: InputLogObject | string, ...args: unknown[]): void;
	warn(message: InputLogObject | string, ...args: unknown[]): void;
	info(message: InputLogObject | string, ...args: unknown[]): void;
	error(message: InputLogObject | string, ...args: unknown[]): void;
	debug(message: InputLogObject | string, ...args: unknown[]): void;
}

export class Logger implements ILogger {
	private _clearScreenPending: string | undefined;
	private readonly consola = createNadleConsola();
	public readonly outputStream: NodeJS.WriteStream = process.stdout;
	public readonly errorStream: NodeJS.WriteStream = process.stderr;

	public init(options: LoggerOptions) {
		const { logLevel = "log", isWorkerThread = false } = options;
		this.consola.level = LogLevels[logLevel];

		if (this.outputStream.isTTY) {
			this.outputStream.write(HIDE_CURSOR);
		}

		if (!isWorkerThread) {
			this.debug(
				`Initialized logger with Consola reporters: [${this.consola.options.reporters.map((reporter) => reporter.constructor.name).join(", ")}]`
			);
		}
	}

	public log(message: InputLogObject | string, ...args: unknown[]): void {
		l.log("log", message, ...args);
		this._clearScreen();
		this.consola.log(message, ...args);
	}

	public error(message: InputLogObject | string, ...args: unknown[]): void {
		l.log("error", message, ...args);

		this._clearScreen();
		this.consola.error(message, ...args);
	}

	public warn(message: InputLogObject | string, ...args: unknown[]): void {
		l.log("warn", message, ...args);

		this._clearScreen();
		this.consola.warn(message, ...args);
	}

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

	private clearFullScreen(message = ""): void {
		l.log("clearFullScreen");

		if (message) {
			this.consola.log(`${CLEAR_SCREEN}${ERASE_SCROLLBACK}${message}`);
		} else {
			(this.outputStream as Writable).write(`${CLEAR_SCREEN}${ERASE_SCROLLBACK}`);
		}
	}

	private clearScreen(message: string, force = false): void {
		l.log("clearScreen", { message });

		this._clearScreenPending = message;

		if (force) {
			this._clearScreen();
		}
	}

	private _clearScreen() {
		l.log("_clearScreen");

		if (this._clearScreenPending == null) {
			return;
		}

		const log = this._clearScreenPending;
		this._clearScreenPending = undefined;
		this.consola.log(`${CURSOR_TO_START}${ERASE_DOWN}${log}`);
	}

	public getColumns(): number {
		return "columns" in this.outputStream ? this.outputStream.columns : 80;
	}
}
