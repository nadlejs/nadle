import type { Writable } from "node:stream";

// eslint-disable-next-line no-restricted-imports
import { consola, LogLevels, type LogType } from "consola";

import { FileLogger } from "./file-logger.js";
import { ERASE_DOWN, HIDE_CURSOR, CLEAR_SCREEN, CURSOR_TO_START, ERASE_SCROLLBACK } from "./constants.js";

export const SupportLogLevels = ["error", "log", "info", "debug"] as const satisfies LogType[];
export type SupportLogLevel = (typeof SupportLogLevels)[number];

const l = new FileLogger("logger");

export class Logger {
	private _clearScreenPending: string | undefined;

	constructor(
		public logLevel: SupportLogLevel = "log",
		public outputStream: NodeJS.WriteStream | Writable = process.stdout,
		public errorStream: NodeJS.WriteStream | Writable = process.stderr
	) {
		consola.level = LogLevels[this.logLevel];

		if ((this.outputStream as typeof process.stdout).isTTY) {
			(this.outputStream as Writable).write(HIDE_CURSOR);
		}

		this.info(`Initializing Logger with level ${consola.level}`);
	}

	log(message: string, ...args: unknown[]): void {
		l.log("log", message, ...args);
		this._clearScreen();
		consola.log(message, ...args);
	}

	error(message: string, ...args: unknown[]): void {
		l.log("error", message, ...args);

		this._clearScreen();
		consola.error(message, ...args);
	}

	warn(message: string, ...args: unknown[]): void {
		l.log("warn", message, ...args);

		this._clearScreen();
		consola.warn(message, ...args);
	}

	info(message: string, ...args: unknown[]): void {
		l.log("info", message, ...args);

		this._clearScreen();
		consola.info(message, ...args);
	}

	clearFullScreen(message = ""): void {
		l.log("clearFullScreen");

		if (message) {
			consola.log(`${CLEAR_SCREEN}${ERASE_SCROLLBACK}${message}`);
		} else {
			(this.outputStream as Writable).write(`${CLEAR_SCREEN}${ERASE_SCROLLBACK}`);
		}
	}

	clearScreen(message: string, force = false): void {
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
		consola.log(`${CURSOR_TO_START}${ERASE_DOWN}${log}`);
	}

	getColumns(): number {
		return "columns" in this.outputStream ? this.outputStream.columns : 80;
	}
}
