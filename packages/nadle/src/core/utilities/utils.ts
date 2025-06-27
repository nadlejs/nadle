import Path from "node:path";

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

export function normalizeGlobPath(path: string) {
	if (path.startsWith(".")) {
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
