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

new Nadle({ ...argv, configPath: argv.config, logLevel: argv.logLevel as SupportLogLevel }).execute().catch((error) => {
	// eslint-disable-next-line no-console
	console.error(error);
	// eslint-disable-next-line n/no-process-exit
	process.exit(1);
});
