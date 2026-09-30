import { type Options } from "yargs";

import { CLIOptions } from "./cli-options.js";

/**
 * A machine-readable description of a single CLI flag, derived from {@link CLIOptions}.
 */
export interface FlagManifestEntry {
	/** Flag name without leading dashes (e.g. `dry-run`). */
	readonly name: string;
	/** Value type (`boolean`, `string`, ...); `string[]` when the flag accepts an array. */
	readonly type: string;
	/** Default value or its textual description, if any. */
	readonly default?: unknown;
	/** Human-readable description, if any. */
	readonly description?: string;
	/** Short aliases (e.g. `["m"]` for `--dry-run`). */
	readonly aliases: readonly string[];
	/** Allowed values, when the flag is an enumeration. */
	readonly choices?: readonly string[];
}

function toArray<T>(value: T | readonly T[] | undefined): readonly T[] {
	if (value === undefined) {
		return [];
	}

	return Array.isArray(value) ? value : [value as T];
}

function describe(options: Options): string | undefined {
	return options.description ?? options.describe;
}

function resolveType(options: Options): string {
	const base = options.type ?? "string";

	return options.array ? `${base}[]` : base;
}

function resolveDefault(options: Options): unknown {
	return options.defaultDescription ?? options.default;
}

/**
 * Builds the flag manifest from {@link CLIOptions} — the same definitions that drive option
 * parsing — so the manifest can never drift from the flags Nadle actually accepts. Hidden
 * (internal) flags are omitted.
 */
export function buildFlagManifest(): FlagManifestEntry[] {
	return Object.values(CLIOptions)
		.filter(({ options }) => !(options as Options).hidden)
		.map(({ key, options }) => {
			const opts = options as Options;
			const entry: FlagManifestEntry = {
				name: key,
				type: resolveType(opts),
				aliases: toArray(opts.alias),
				...(describe(opts) !== undefined ? { description: describe(opts) } : {}),
				...(resolveDefault(opts) !== undefined ? { default: resolveDefault(opts) } : {}),
				...(opts.choices !== undefined ? { choices: opts.choices as readonly string[] } : {})
			};

			return entry;
		});
}
