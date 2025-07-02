import type { Writable } from "node:stream";
import { stripVTControlCharacters } from "node:util";

import { type Logger } from "../logger.js";
import { FileLogger } from "../file-logger.js";

const DEFAULT_RENDER_INTERVAL_MS = 100;

const ESC = "\x1B[";
const CLEAR_LINE = `${ESC}K`;
const MOVE_CURSOR_ONE_ROW_UP = `${ESC}1A`;
const SYNC_START = `${ESC}?2026h`;
const SYNC_END = `${ESC}?2026l`;

interface Renderer {
	start(): void;
	finish(): void;
	schedule(): void;
}
namespace FooterRenderer {
	export interface Options {
		logger: Logger;
		interval?: number;
		getWindow: () => string[];
	}
}

type StreamType = "output" | "error";
const l = new FileLogger("WindowRenderer");
/**
 * Renders content of `getWindow` at the bottom of the terminal and
 * forwards all other intercepted `stdout` and `stderr` logs above it.
 */
export class FooterRenderer implements Renderer {
	private readonly options: Required<FooterRenderer.Options>;
	private readonly streams!: Record<StreamType, Logger["outputStream" | "errorStream"]["write"]>;
	private readonly buffer: { message: string; type: StreamType }[] = [];
	private renderInterval: NodeJS.Timeout | undefined = undefined;
	private renderScheduled = false;

	private windowHeight = 0;
	private finished = false;
	private readonly cleanups: (() => void)[] = [];

	public constructor(options: FooterRenderer.Options) {
		this.options = {
			interval: DEFAULT_RENDER_INTERVAL_MS,
			...options
		};

		this.streams = {
			error: options.logger.errorStream.write.bind(options.logger.errorStream),
			output: options.logger.outputStream.write.bind(options.logger.outputStream)
		};

		this.cleanups.push(this.interceptStream(process.stdout, "output"), this.interceptStream(process.stderr, "error"));

		// Write buffered content on unexpected exits, e.g. direct `process.exit()` calls
		// this.options.logger.onTerminalCleanup(() => {
		// 	this.flushBuffer();
		// 	this.stop();
		// });

		this.start();
	}

	public start(): void {
		l.log("start");
		this.finished = false;
		this.renderInterval = setInterval(() => this.schedule(), this.options.interval).unref();
	}

	public stop(): void {
		l.log("stop");

		this.cleanups.splice(0).forEach((fn) => fn());
		clearInterval(this.renderInterval);
	}

	/**
	 * Write all buffered output and stop buffering.
	 * All intercepted writes are forwarded to actual write after this.
	 */
	public finish(): void {
		l.log("finish");

		this.finished = true;
		this.flushBuffer();
		clearInterval(this.renderInterval);
	}

	/**
	 * Queue new render update
	 */
	public schedule(): void {
		if (!this.renderScheduled) {
			this.renderScheduled = true;
			this.flushBuffer();

			setTimeout(() => {
				this.renderScheduled = false;
			}, 100).unref();
		}
	}

	private flushBuffer() {
		if (this.buffer.length === 0) {
			return this.render();
		}

		let current;

		// Concatenate same types into a single render
		for (const next of this.buffer.splice(0)) {
			if (!current) {
				current = next;
				continue;
			}

			if (current.type !== next.type) {
				this.render(current.message, current.type);
				current = next;
				continue;
			}

			current.message += next.message;
		}

		if (current) {
			this.render(current.message, current.type);
		}
	}

	private render(message?: string, type: StreamType = "output") {
		l.log("render", { message });

		if (this.finished) {
			this.clearWindow();

			return this.write(message ?? "", type);
		}

		const win = this.windowHeight;
		const windowContent = this.options.getWindow();
		const rowCount = getRenderedRowCount(windowContent, this.options.logger.getColumns());
		let padding = this.windowHeight - rowCount;

		if (padding > 0 && message) {
			padding -= getRenderedRowCount([message], this.options.logger.getColumns());
		}

		l.log("render", { padding, rowCount, windowHeight: win, col: this.options.logger.getColumns() });

		this.write(SYNC_START);
		this.clearWindow();

		if (message) {
			this.write(message, type);
		}

		if (padding > 0) {
			this.write("\n".repeat(padding));
		}

		this.write(windowContent.join("\n"));

		this.write(SYNC_END);

		this.windowHeight = rowCount + Math.max(0, padding);
	}

	private clearWindow() {
		l.log("clearWindow", `this.windowHeight = ${this.windowHeight}`);

		if (this.windowHeight === 0) {
			return;
		}

		this.write(CLEAR_LINE);

		for (let i = 1; i < this.windowHeight; i++) {
			this.write(`${MOVE_CURSOR_ONE_ROW_UP}${CLEAR_LINE}`);
		}

		this.windowHeight = 0;
	}

	private interceptStream(stream: NodeJS.WriteStream, type: StreamType) {
		const original = stream.write;

		// @ts-expect-error -- not sure how 2 overloads should be typed
		stream.write = (chunk, _, callback) => {
			if (chunk) {
				if (this.finished) {
					this.write(chunk.toString(), type);
				} else {
					this.buffer.push({ type, message: chunk.toString() });
				}
			}

			callback?.();
		};

		return function restore() {
			stream.write = original;
		};
	}

	private write(message: string, type: "output" | "error" = "output") {
		l.log("write", { message });

		(this.streams[type] as Writable["write"])(message);
	}
}

/** Calculate the actual row count needed to render `rows` into `stream` */
function getRenderedRowCount(rows: string[], columns: number) {
	let count = 0;

	for (const row of rows) {
		const text = stripVTControlCharacters(row);
		count += Math.max(1, Math.ceil(text.length / columns));
	}

	return count;
}
