/* eslint-disable perfectionist/sort-objects */
import { type Options } from "yargs";
import { CONFIG_FILE_PATTERN } from "@nadle/project-resolver";

import { type NadleCLIOptions } from "./types.js";
import { Messages } from "../utilities/messages.js";
import { SupportLogLevels } from "../utilities/consola.js";
import { ConfigurationError } from "../utilities/nadle-error.js";

export const CLIOptions = {
	configFile: {
		key: "config",
		options: {
			alias: "c",
			type: "string",
			description: "Path to config file",
			defaultDescription: `<cwd>/${CONFIG_FILE_PATTERN}`
		}
	},
	list: {
		key: "list",
		options: {
			alias: "l",
			default: false,
			type: "boolean",
			description: "List all available tasks"
		}
	},
	listWorkspaces: {
		key: "list-workspaces",
		options: {
			default: false,
			type: "boolean",
			description: "List all available workspaces"
		}
	},
	parallel: {
		key: "parallel",
		options: {
			default: false,
			type: "boolean",
			description: "Run all specified tasks in parallel regardless of their order, while still respecting task dependencies."
		}
	},
	dryRun: {
		key: "dry-run",
		options: {
			alias: "m",
			default: false,
			type: "boolean",
			description: "Run specified tasks in dry run mode"
		}
	},
	watch: {
		key: "watch",
		options: {
			alias: "w",
			default: false,
			type: "boolean",
			description: "Re-run the requested tasks when their inputs change"
		}
	},
	graph: {
		key: "graph",
		options: {
			type: "string",
			// Bare `--graph` yields "" → treated as the default "tree" format in the resolver.
			choices: ["", "tree", "mermaid"] as const,
			description: "Print the task dependency graph instead of executing (tree or mermaid)"
		}
	},
	explain: {
		key: "explain",
		options: {
			type: "string",
			description: "Explain why a task runs, what depends on it, and its inputs, instead of executing"
		}
	},
	since: {
		key: "since",
		options: {
			type: "string",
			description: "Run only the requested tasks affected by changes since the given git ref"
		}
	},
	why: {
		key: "why",
		options: {
			default: false,
			type: "boolean",
			description: "Explain each task's cache outcome (hit/miss and what changed)"
		}
	},
	stacktrace: {
		key: "stacktrace",
		options: {
			default: false,
			type: "boolean",
			description: "Print stacktrace on error"
		}
	},
	showConfig: {
		key: "show-config",
		options: {
			default: false,
			type: "boolean",
			description: "Print the resolved configuration"
		}
	},
	configKey: {
		key: "config-key",
		options: {
			type: "string",
			description: "Path to a specific resolved configuration value, using dot/bracket notation",
			defaultDescription: "undefined"
		}
	},
	json: {
		key: "json",
		options: {
			default: false,
			type: "boolean",
			description: "Emit machine-readable JSON from read commands (--list, --list-workspaces, --dry-run, --graph, --explain) instead of human text"
		}
	},
	footer: {
		key: "footer",
		options: {
			type: "boolean",
			defaultDescription: "!isCI && isTTY",
			description: "Enables the in-progress summary footer during task execution"
		}
	},
	reporter: {
		key: "reporter",
		options: {
			type: "string",
			defaultDescription: "default",
			description: "Output reporter: a built-in ('default'/'agent') or a plugin-registered reporter name"
		}
	},
	cache: {
		key: "cache",
		options: {
			hidden: true,
			type: "boolean"
		}
	},
	// @ts-expect-error to show --no-cache option when using -h
	noCache: {
		key: "no-cache",
		options: {
			type: "boolean" as const,
			defaultDescription: "false",
			description: "Disable task caching. All tasks will be executed and their results will not be stored"
		}
	},
	cacheDir: {
		key: "cache-dir",
		options: {
			type: "string",
			defaultDescription: "<projectDir>/node_modules/.cache/nadle",
			description: "Directory to store task cache results"
		}
	},
	cleanCache: {
		key: "clean-cache",
		options: {
			type: "boolean" as const,
			default: false,
			description: "Deletes all files in the cache directory. Can be used with --cache-dir to specify a custom location"
		}
	},
	summary: {
		key: "summary",
		options: {
			type: "boolean" as const,
			default: false,
			description: "Print a summary at the end of the run: task durations, critical path, and cache-miss hotspots"
		}
	},
	doctor: {
		key: "doctor",
		options: {
			type: "boolean" as const,
			default: false,
			description: "Diagnose project, config, and cache health without executing tasks"
		}
	},
	capabilities: {
		key: "capabilities",
		options: {
			type: "boolean" as const,
			default: false,
			description: "Emit a machine-readable JSON description of CLI flags, tasks, and task configuration schema"
		}
	},

	exclude: {
		key: "exclude",
		options: {
			type: "string" as const,
			alias: "x",
			description: "Tasks to exclude from execution",
			array: true,
			coerce: coerceList
		}
	},

	logLevel: {
		key: "log-level",
		options: {
			type: "string",
			defaultDescription: "log",
			choices: SupportLogLevels,
			describe: "Set the logging level"
		}
	},
	minWorkers: {
		key: "min-workers",
		options: {
			type: "string",
			describe: "Minimum number of workers (integer or percentage)",
			defaultDescription: "Os.availableParallelism() - 1",
			coerce: createWorkerCoercer("min")
		}
	},
	maxWorkers: {
		key: "max-workers",
		options: {
			type: "string",
			describe: "Maximum number of workers (integer or percentage)",
			defaultDescription: "Os.availableParallelism() - 1",
			coerce: createWorkerCoercer("max")
		}
	}
} satisfies Record<Exclude<keyof NadleCLIOptions, "tasks" | "isWorkerThread">, { key: string; options: Options }>;

function coerceList(val: string[]): string[] {
	return val.flatMap((v) => v.split(",").map((s) => s.trim())).filter(Boolean);
}

function createWorkerCoercer(type: "min" | "max") {
	return (workers: string | undefined) => {
		if (workers === undefined) {
			return undefined;
		}

		if (/^\d+$/.test(workers)) {
			return Number(workers);
		}

		if (/^\d+(\.\d+)?%$/.test(workers)) {
			return workers;
		}

		throw new ConfigurationError(Messages.InvalidWorkerConfig(type, workers));
	};
}
