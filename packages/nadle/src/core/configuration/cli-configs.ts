import { type Options } from "yargs";

import { ConfigsResolver } from "./configs-resolver.js";
import { type NadleCLIConfigurations } from "./types.js";
import { SupportLogLevels } from "../presentation/logger.js";

export function resolveCLIConfigs(argv: Record<string, unknown>): NadleCLIConfigurations {
	let resolvedConfigs = {};

	const aliases = Object.values(CLIConfigs)
		.map(({ options }) => (options as Options).alias)
		.filter(Boolean);

	for (const [key, value] of Object.entries(argv)) {
		if (aliases.includes(key) || key.includes("-") || key === "_" || key === "$0" || key === "tasks") {
			continue;
		}

		if ((key === "minWorkers" || key === "maxWorkers") && value === undefined) {
			continue;
		}

		if (key === "config") {
			if (value !== undefined) {
				resolvedConfigs = { ...resolvedConfigs, configPath: value };
			}

			continue;
		}

		resolvedConfigs = { ...resolvedConfigs, [key]: value };
	}

	return resolvedConfigs as NadleCLIConfigurations;
}

/* eslint-disable perfectionist/sort-objects */

export const CLIConfigs = {
	configPath: {
		key: "config",
		options: {
			alias: "c",
			type: "string",
			description: "Path to config file",
			defaultDescription: `<cwd>/build.nadle.{${ConfigsResolver.SUPPORT_EXTENSIONS.join(",")}}`
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
} satisfies Record<Exclude<keyof NadleCLIConfigurations, "tasks" | "isWorkerThread">, { key: string; options: Options }>;

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
