import c from "tinyrainbow";

import { CacheMissReason } from "../models/cache/cache-miss-reason.js";
import { type CacheValidationResult } from "../caching/cache-validator.js";
import { type TaskConfiguration } from "../interfaces/task-configuration.js";

/**
 * Human-readable explanation of a task's cache outcome, emitted under `--why`.
 * Hit cases say so; a cache miss lists what changed (file/options/config) using
 * the reasons already computed by CacheValidator.
 */
export function explainCacheOutcome(label: string, result: CacheValidationResult, config: TaskConfiguration): string {
	const head = `${c.yellow("why")} ${c.bold(label)}:`;

	switch (result.result) {
		case "not-cacheable":
			return `${head} not cacheable — ${describeNotCacheable(config)}`;
		case "cache-disabled":
			return `${head} caching disabled`;
		case "up-to-date":
			return config.outputs === undefined
				? `${head} ${c.green("up-to-date")} — inputs unchanged since it last passed`
				: `${head} ${c.green("up-to-date")} — inputs and outputs unchanged`;
		case "restore-from-cache":
			return `${head} ${c.green("restored from cache")} — inputs match a previous run`;
		case "cache-miss":
			return [
				`${head} ${c.red("cache miss")} — will run because:`,
				...result.reasons.map((reason) => `  - ${CacheMissReason.toString(reason)}`)
			].join("\n");
	}
}

/**
 * Names the specific reason a task is structurally never cached, so `--why` answers the
 * question where it is asked instead of deferring to a separate `--doctor` run.
 */
function describeNotCacheable(config: TaskConfiguration): string {
	if (config.inputs === undefined && config.outputs === undefined) {
		return "declares no inputs or outputs";
	}

	if (config.inputs === undefined) {
		return "declares outputs but no inputs";
	}

	return "declares inputs but no outputs; set cacheVerdict if it produces no files";
}
