import Path from "node:path";

import c from "tinyrainbow";

import { DOT } from "./constants.js";

export function noop() {}

export function capitalize(str: string): string {
	if (str.length === 0) {
		return str;
	}

	return str.charAt(0).toUpperCase() + str.slice(1);
}

const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;

export function formatTime(ms: number): string {
	const hours = Math.floor(ms / MILLISECONDS_PER_HOUR);
	const minutes = Math.floor((ms % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE);
	const seconds = Math.floor((ms % MILLISECONDS_PER_MINUTE) / MILLISECONDS_PER_SECOND);
	const milliseconds = Math.floor(ms % MILLISECONDS_PER_SECOND);

	if (hours > 0) {
		if (minutes > 0) {
			return `${hours}h${minutes}m`;
		}

		return `${hours}h`;
	}

	if (minutes > 0) {
		if (seconds > 0) {
			return `${minutes}m${seconds}s`;
		}

		return `${minutes}m`;
	}

	if (seconds > 0) {
		return `${seconds}s`;
	}

	return `${milliseconds}ms`;
}

export function normalizeGlobPath(path: string) {
	if (path.startsWith(DOT)) {
		return path;
	}

	return `.${Path.sep}${path}`;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function bindObject<T, K extends keyof T>(obj: T, keys: K[]): { [P in K]: T[P] extends (...args: any[]) => any ? T[P] : never } {
	return Object.fromEntries(
		keys.map((key) => {
			const value = obj[key];

			if (typeof value !== "function") {
				throw new Error(`Property ${String(key)} is not a function`);
			}

			return [key, value.bind(obj)];
		})
	) as any;
}

export function highlight(text: string): string {
	return c.bold(c.yellow(text));
}
