import { type Project } from "@nadle/project-resolver";

import { type SupportLogLevel } from "../utilities/consola.js";
import { type ResolvedTask } from "../interfaces/resolved-task.js";

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
	/** Maximum number of cache entries to keep per task. Oldest are evicted when exceeded. */
	readonly maxCacheEntries?: number;
	/** Log level for reporting. */
	readonly logLevel?: SupportLogLevel;
	/** Minimum number of worker threads (number or string, e.g., "50%"). */
	readonly minWorkers?: number | string;
	/** Maximum number of worker threads (number or string, e.g., "100%"). */
	readonly maxWorkers?: number | string;
	/** Enable or disable implicit workspace task dependencies. */
	readonly implicitDependencies?: boolean;
}

/**
 * CLI options for Nadle, extending base options.
 */
export interface NadleCLIOptions extends NadleBaseOptions {
	/** List of tasks to execute. */
	readonly tasks: string[];
	/** List of tasks to exclude from execution. */
	readonly excludedTasks?: string[];

	/** List all available tasks. */
	readonly list: boolean;
	/** List all workspaces. */
	readonly listWorkspaces: boolean;

	/** Perform a dry run without executing tasks. */
	readonly dryRun: boolean;
	/** Show summary after execution. */
	readonly summary?: boolean;

	/** Show stacktrace on errors. */
	readonly stacktrace: boolean;
	/** Clean the cache before running. */
	readonly cleanCache?: boolean;

	/** Path to configuration file. */
	readonly configFile?: string;

	/** Path to a specific resolved configuration value, using dot/bracket notation. */
	readonly configKey?: string;
	/** Show resolved configuration. */
	readonly showConfig: boolean;
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
export interface NadleResolvedOptions extends Required<
	Omit<NadleCLIOptions, "maxWorkers" | "minWorkers" | "configKey" | "configFile" | "tasks" | "excludedTasks">
> {
	/** Project information. */
	readonly project: Project;

	/** Minimum number of worker threads (resolved as number). */
	readonly minWorkers: number;
	/** Maximum number of worker threads (resolved as number). */
	readonly maxWorkers: number;

	/** Path to a specific resolved configuration value, using dot/bracket notation. */
	readonly configKey?: string;

	/** List of tasks to execute after resolution and auto-correction. */
	readonly tasks: ResolvedTask[];
	/** List of tasks to exclude from execution after resolution and auto-correction. */
	readonly excludedTasks: ResolvedTask[];
}
