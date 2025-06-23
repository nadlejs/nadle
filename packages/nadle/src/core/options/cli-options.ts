/* eslint-disable perfectionist/sort-objects */
import { type Options } from "yargs";

import { SupportLogLevels } from "../logger.js";
import { type NadleCLIOptions } from "./types.js";
import { OptionsResolver } from "./options-resolver.js";

export const CLIOptions = {
	configPath: {
		key: "config",
		options: {
			alias: "c",
			type: "string",
			description: "Path to config file",
			defaultDescription: `<cwd>/build.nadle.{${OptionsResolver.SUPPORT_EXTENSIONS.join(",")}}`
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
	showSummary: {
		key: "show-summary",
		options: {
			hidden: true,
			type: "boolean"
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
			defaultDescription: "<projectDir>/.nadle",
			description: "Directory to store task cache results"
		}
	},

	exclude: {
		key: "exclude",
		options: {
			type: "string" as const,
			alias: "x",
			description: "Tasks to exclude from execution",
			array: true,
			coerce: (val: string[]) => val.flatMap((v) => v.split(",").map((s) => s.trim())).filter(Boolean)
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

		throw new Error(`Invalid value for --${type}-workers. It should be an integer or a percentage (e.g., 50%).`);
	};
}
