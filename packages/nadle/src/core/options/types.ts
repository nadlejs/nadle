import { type Project } from "../models/project.js";
import { type SupportLogLevel } from "../reporting/logger.js";

/**
 * Base options for Nadle configuration.
 */
export interface NadleBaseOptions {
	/** Enable or disable caching. */
	readonly cache?: boolean;
	/** Directory to store cache files. */
	readonly cacheDir?: string;

	/** Show footer in output. */
	readonly footer?: boolean;
	/** Enable or disable parallel task execution. */
	readonly parallel?: boolean;
	/** Log level for reporting. */
	readonly logLevel?: SupportLogLevel;
	/** Minimum number of worker threads (number or string, e.g., "50%"). */
	readonly minWorkers?: number | string;
	/** Maximum number of worker threads (number or string, e.g., "100%"). */
	readonly maxWorkers?: number | string;

	/** @internal True if running in a worker thread. */
	readonly isWorkerThread?: boolean;
}

/**
 * CLI options for Nadle, extending base options.
 */
export interface NadleCLIOptions extends NadleBaseOptions {
	/** List all available tasks. */
	readonly list: boolean;
	/** Perform a dry run without executing tasks. */
	readonly dryRun: boolean;
	/** Show summary after execution. */
	readonly summary?: boolean;
	/** Path to configuration file. */
	readonly configFile?: string;
	/** Show resolved configuration. */
	readonly showConfig: boolean;
	/** Show stacktrace on errors. */
	readonly stacktrace: boolean;
	/** Clean the cache before running. */
	readonly cleanCache?: boolean;

	/** List of tasks to exclude from execution. */
	readonly excludedTasks?: string[];
}

/**
 * File-based options for Nadle configuration.
 */
export interface NadleFileOptions extends Partial<NadleBaseOptions> {
	/** Task alias configuration. */
	readonly alias?: AliasOption;
}

/**
 * Alias configuration for tasks.
 * Can be a record of alias mappings or a function returning an alias for a workspace path.
 */
export type AliasOption = Record<string, string> | ((workspacePath: string) => string | undefined);

/**
 * Fully resolved Nadle options, including required fields and project reference.
 */
export interface NadleResolvedOptions extends Required<Omit<NadleCLIOptions, "maxWorkers" | "minWorkers">> {
	/** Project information. */
	readonly project: Project;

	/** Minimum number of worker threads (resolved as number). */
	readonly minWorkers: number;
	/** Maximum number of worker threads (resolved as number). */
	readonly maxWorkers: number;
}

/**
 * Shape of the Nadle configuration in package.json.
 */
export interface NadlePackageJson {
	readonly nadle?: {
		/** Mark this package as the Nadle root. */
		root?: true;
	};
}
