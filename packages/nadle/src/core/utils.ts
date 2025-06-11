import Path from "node:path";
import Crypto from "node:crypto";

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

/**
 * Create a stable SHA-256 hash from structured data.
 * Handles primitives, arrays (ordered), and objects (unordered with sorted keys).
 */
export function createStructuredHash(input: unknown): string {
	const hash = Crypto.createHash("sha256");

	const feed = (value: unknown) => {
		if (value === null || value === undefined) {
			hash.update("null\n");
		} else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			hash.update(`primitive:${JSON.stringify(value)}\n`);
		} else if (Array.isArray(value)) {
			hash.update("array:\n");

			for (const item of [...value].sort()) {
				feed(item);
			}

			hash.update("endArray\n");
		} else if (typeof value === "object") {
			hash.update("object:\n");

			for (const key of Object.keys(value).sort()) {
				hash.update(`key:${key}\n`);
				feed((value as Record<string, unknown>)[key]);
			}

			hash.update("endObject\n");
		} else {
			throw new Error(`Unsupported type in structured hash: ${typeof value}`);
		}
	};

	feed(input);

	return hash.digest("hex");
}
