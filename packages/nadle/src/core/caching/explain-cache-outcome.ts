import c from "tinyrainbow";

import { type CacheValidationResult } from "./cache-validator.js";
import { CacheMissReason } from "../models/cache/cache-miss-reason.js";

/**
 * Human-readable explanation of a task's cache outcome, emitted under `--why`.
 * Hit cases say so; a cache miss lists what changed (file/options/config) using
 * the reasons already computed by CacheValidator.
 */
export function explainCacheOutcome(label: string, result: CacheValidationResult): string {
	const head = `${c.yellow("why")} ${c.bold(label)}:`;

	switch (result.result) {
		case "not-cacheable":
			return `${head} not cacheable (no inputs/outputs declared)`;
		case "cache-disabled":
			return `${head} caching disabled`;
		case "up-to-date":
			return `${head} ${c.green("up-to-date")} — inputs and outputs unchanged`;
		case "restore-from-cache":
			return `${head} ${c.green("restored from cache")} — inputs match a previous run`;
		case "cache-miss":
			return [
				`${head} ${c.red("cache miss")} — will run because:`,
				...result.reasons.map((reason) => `  - ${CacheMissReason.toString(reason)}`)
			].join("\n");
	}
}
