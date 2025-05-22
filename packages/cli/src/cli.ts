import * as process from "node:process";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Nadle, SupportLogLevels, type SupportLogLevel } from "nadle-core";

const argv = yargs(hideBin(process.argv))
	.scriptName("nadle")
	.command("$0 [tasks...]", "Run one or many tasks")
	.option("config", {
		alias: "c",
		type: "string",
		default: "build.nadle.ts",
		description: "Path to config file",
		defaultDescription: "<cwd>/build.nadle.ts"
	})
	.option("min-workers", {
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
	})
	.option("max-workers", {
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
	})
	.option("log-level", {
		type: "string",
		default: "log",
		choices: SupportLogLevels,
		describe: "Set the logging level"
	})
	.option("list", { alias: "l", default: false, type: "boolean", description: "List all available tasks" })
	.option("dry-run", { default: false, type: "boolean", description: "Run tasks in dry run mode" })
	.option("show-summary", { hidden: true, type: "boolean" })
	.help("help")
	.alias("help", "h")
	.parseSync();

const removedAliasArgv = Object.fromEntries(
	Object.entries(argv).filter(([key]) => !["$0", "_", "l", "c", "dry-run", "show-summary", "log-level", "min-workers", "max-workers"].includes(key))
);

new Nadle({ ...removedAliasArgv, configPath: argv.config, logLevel: removedAliasArgv.logLevel as SupportLogLevel }).execute();
