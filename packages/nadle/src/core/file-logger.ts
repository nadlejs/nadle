import * as Path from "node:path";
import { inspect } from "node:util";
import * as Fs from "node:fs/promises";

interface LogItem {
	args: any[];
	subspace: string;
	namespace: string;
}

const logItems: LogItem[] = [];

const ESC = "\\x1B[";
const CLEAR_LINE: string = `${ESC}K`;
const MOVE_CURSOR_ONE_ROW_UP: string = `${ESC}1A`;
const SYNC_START: string = `${ESC}?2026h`;
const SYNC_END: string = `${ESC}?2026l`;
const ERASE_DOWN: string = `${ESC}J`;
const ERASE_SCROLLBACK: string = `${ESC}3J`;
const CURSOR_TO_START: string = `${ESC}1;1H`;
const HIDE_CURSOR: string = `${ESC}?25l`;
const SHOW_CURSOR: string = `${ESC}?25h`;
const CLEAR_SCREEN: string = "\\x1Bc";

const ANSI: Record<string, string> = {
	SYNC_END,
	ERASE_DOWN,
	CLEAR_LINE,
	SYNC_START,
	HIDE_CURSOR,
	SHOW_CURSOR,
	CLEAR_SCREEN,
	CURSOR_TO_START,
	ERASE_SCROLLBACK,
	MOVE_CURSOR_ONE_ROW_UP
};

export const filePath: string = Path.join(import.meta.dirname, "..", "..", "logs", `${new Date().toISOString()}.txt`);
export async function emit(): Promise<void> {
	let data = logItems
		.map(({ args, subspace, namespace }) => {
			return `[${namespace}] ${subspace}\n${inspect(args, { depth: 2 })}`;
		})
		.join("\n");

	for (const [key, value] of Object.entries(ANSI)) {
		data = data.replaceAll(value, `{${key}}`);
	}

	await Fs.writeFile(filePath, data, { encoding: "utf-8" });
}

export class FileLogger {
	constructor(public namespace: string) {}

	log(subspace: string, ...args: any[]): void {
		logItems.push({ args, subspace, namespace: this.namespace });
	}
}
