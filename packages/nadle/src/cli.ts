import * as process from "node:process";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { Nadle } from "./core/nadle.js";
import { SupportLogLevels, type SupportLogLevel } from "./core/logger.js";

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
	.option("show-summary", { default: true, type: "boolean", description: "Show progress summary" })
	.help("help")
	.alias("help", "h")
	.parseSync();

new Nadle({ ...argv, configPath: argv.config, logLevel: argv.logLevel as SupportLogLevel }).execute().then(async () => {
	// await emit();
});
