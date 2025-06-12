import Path from "node:path";

import objectHash from "object-hash";

export function noop() {}

export function capitalize(str: string): string {
	if (str.length === 0) {
		return str;
	}

	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatTime(time: number): string {
	if (time > 1000) {
		return `${Math.round(time / 1000)}s`;
	}

	return `${Math.round(time)}ms`;
}

export function formatTimeString(date: Date): string {
	return date.toTimeString().split(" ")[0];
}

export function normalizeGlobPath(path: string) {
	if (path.startsWith(".")) {
		return path;
	}

	return `.${Path.sep}${path}`;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function hashObject(object: Record<string, unknown>): string {
	return objectHash(object, { encoding: "hex", algorithm: "sha256", unorderedArrays: true, unorderedObjects: true });
}
