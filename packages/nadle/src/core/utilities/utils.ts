import Path from "node:path";

import { DOT } from "./constants.js";

export function noop() {}

export function capitalize(str: string): string {
	if (str.length === 0) {
		return str;
	}

	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatTime(ms: number): string {
	const minutes = Math.floor(ms / 60_000);
	const seconds = Math.floor((ms % 60_000) / 1000);
	const milliseconds = Math.floor(ms % 1000);

	if (minutes > 0) {
		return seconds > 0 ? `${minutes}m${seconds}s` : `${minutes}m`;
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
