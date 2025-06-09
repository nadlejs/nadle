import * as process from "node:process";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { VERSION } from "./version.js";
import { Nadle } from "./layers/orchestration/nadle.js";
import { CLIOptions, resolveCLIOptions } from "./layers/configuration/cli-options.js";

const argv = yargs(hideBin(process.argv))
	.scriptName("nadle")
	.command("$0 [tasks...]", "Execute one or more named tasks")

	.option(CLIOptions.configPath.key, CLIOptions.configPath.options)
	.option(CLIOptions.parallel.key, CLIOptions.parallel.options)
	.option(CLIOptions.minWorkers.key, CLIOptions.minWorkers.options)
	.option(CLIOptions.maxWorkers.key, CLIOptions.maxWorkers.options)
	.option(CLIOptions.logLevel.key, CLIOptions.logLevel.options)
	.option(CLIOptions.list.key, CLIOptions.list.options)
	.option(CLIOptions.dryRun.key, CLIOptions.dryRun.options)
	.option(CLIOptions.showConfig.key, CLIOptions.showConfig.options)
	.option(CLIOptions.showSummary.key, CLIOptions.showSummary.options)
	.option(CLIOptions.stacktrace.key, CLIOptions.stacktrace.options)
	.version("version", "Show version number", VERSION)
	.alias("v", "version")
	.help("help", "Show this help")
	.alias("h", "help")
	.group(
		[CLIOptions.parallel.key, CLIOptions.list.key, CLIOptions.dryRun.key, CLIOptions.showConfig.key, CLIOptions.stacktrace.key],
		"Execution options:"
	)
	.group([CLIOptions.configPath.key, CLIOptions.logLevel.key, CLIOptions.minWorkers.key, CLIOptions.maxWorkers.key], "General options:")
	.group(["help", "version"], "Miscellaneous options:")
	.wrap(100)
	.strict()
	.parseSync();

new Nadle(resolveCLIOptions(argv)).execute((argv as any).tasks ?? []);
