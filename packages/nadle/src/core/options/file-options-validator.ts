import { type NadleFileOptions } from "./types.js";
import { SupportLogLevels } from "../utilities/consola.js";
import { SupportReporters } from "../reporting/reporters.js";
import { ConfigurationError } from "../utilities/nadle-error.js";

const WORKER_PATTERN = /^\d+(\.\d+)?%$|^\d+$/;

function fail(option: string, expected: string, value: unknown): never {
	throw new ConfigurationError(`Invalid value for \`${option}\`: expected ${expected}, received ${JSON.stringify(value)}.`);
}

function assertBoolean(options: NadleFileOptions, key: "cache" | "footer" | "parallel" | "implicitDependencies"): void {
	const value = options[key];

	if (value !== undefined && typeof value !== "boolean") {
		fail(key, "a boolean", value);
	}
}

function assertWorker(options: NadleFileOptions, key: "minWorkers" | "maxWorkers"): void {
	const value = options[key];

	if (value === undefined) {
		return;
	}

	if (typeof value === "number") {
		if (!Number.isInteger(value) || value <= 0) {
			fail(key, "a positive integer or a percentage string", value);
		}

		return;
	}

	if (typeof value !== "string" || !WORKER_PATTERN.test(value)) {
		fail(key, 'a positive integer or a percentage string (e.g. "50%")', value);
	}
}

function assertCacheDir(options: NadleFileOptions): void {
	if (options.cacheDir !== undefined && (typeof options.cacheDir !== "string" || options.cacheDir.length === 0)) {
		fail("cacheDir", "a non-empty string", options.cacheDir);
	}
}

function assertMaxCacheEntries(options: NadleFileOptions): void {
	const value = options.maxCacheEntries;

	if (value !== undefined && (typeof value !== "number" || !Number.isInteger(value) || value <= 0)) {
		fail("maxCacheEntries", "a positive integer", value);
	}
}

function assertEnum<T extends string>(value: T | undefined, key: string, allowed: ReadonlyArray<T>): void {
	if (value !== undefined && !allowed.includes(value)) {
		fail(key, `one of ${allowed.map((entry) => `"${entry}"`).join(", ")}`, value);
	}
}

function assertAlias(options: NadleFileOptions): void {
	const value = options.alias;

	if (value !== undefined && typeof value !== "function" && (typeof value !== "object" || value === null)) {
		fail("alias", "an object or a function", value);
	}
}

/**
 * Validates the options passed to `configure()` at config-load time, throwing a
 * `ConfigurationError` for any malformed value. Type checking only catches mistakes in
 * typed config files; this guards plain-JS configs and runtime-computed values.
 */
export function validateFileOptions(options: NadleFileOptions): void {
	assertBoolean(options, "cache");
	assertBoolean(options, "footer");
	assertBoolean(options, "parallel");
	assertBoolean(options, "implicitDependencies");
	assertWorker(options, "minWorkers");
	assertWorker(options, "maxWorkers");
	assertCacheDir(options);
	assertMaxCacheEntries(options);
	assertEnum(options.logLevel, "logLevel", SupportLogLevels);
	assertEnum(options.reporter, "reporter", SupportReporters);
	assertAlias(options);
}
