/* eslint-disable perfectionist/sort-objects */
import { type Options } from "yargs";

import { SupportLogLevels } from "../logger.js";
import { type NadleCLIOptions } from "./types.js";
import { OptionsResolver } from "./options-resolver.js";

export function resolveCLIOptions(argv: Record<string, unknown>): NadleCLIOptions {
	let resolvedOptions = {};

	const aliases = Object.values(CLIOptions)
		.map(({ options }) => (options as Options).alias)
		.filter(Boolean);

	for (const [key, value] of Object.entries(argv)) {
		if (aliases.includes(key) || key.includes("-") || key === "_" || key === "$0" || key === "tasks") {
			continue;
		}

		if (key === "config") {
			if (value !== undefined) {
				resolvedOptions = { ...resolvedOptions, configPath: value };
			}

			continue;
		}

		resolvedOptions = { ...resolvedOptions, [key]: value };
	}

	return resolvedOptions as NadleCLIOptions;
}

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
	dryRun: {
		key: "dry-run",
		options: {
			alias: "m",
			default: false,
			type: "boolean",
			description: "Run specified tasks in dry run mode"
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
			default: undefined,
			describe: "Minimum number of workers (integer or percentage)",
			coerce: (value) => {
				const parsedValue = Number(value);

				if (!isNaN(parsedValue)) {
					return parsedValue;
				}

				return value;
			}
		}
	},
	maxWorkers: {
		key: "max-workers",
		options: {
			type: "string",
			default: undefined,
			describe: "Maximum number of workers (integer or percentage)",
			coerce: (value) => {
				const parsedValue = Number(value);

				if (!isNaN(parsedValue)) {
					return parsedValue;
				}

				return value;
			}
		}
	}
} satisfies Record<Exclude<keyof NadleCLIOptions, "tasks" | "isWorkerThread">, { key: string; options: Options }>;
