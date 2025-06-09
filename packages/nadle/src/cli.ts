import * as process from "node:process";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { VERSION } from "./version.js";
import { Nadle } from "./layers/orchestration/nadle.js";
import { CLIConfigs, resolveCLIConfigs } from "./layers/configuration/cli-configs.js";

const argv = yargs(hideBin(process.argv))
	.scriptName("nadle")
	.command("$0 [tasks...]", "Execute one or more named tasks")

	.option(CLIConfigs.configPath.key, CLIConfigs.configPath.options)
	.option(CLIConfigs.parallel.key, CLIConfigs.parallel.options)
	.option(CLIConfigs.minWorkers.key, CLIConfigs.minWorkers.options)
	.option(CLIConfigs.maxWorkers.key, CLIConfigs.maxWorkers.options)
	.option(CLIConfigs.logLevel.key, CLIConfigs.logLevel.options)
	.option(CLIConfigs.list.key, CLIConfigs.list.options)
	.option(CLIConfigs.dryRun.key, CLIConfigs.dryRun.options)
	.option(CLIConfigs.showConfig.key, CLIConfigs.showConfig.options)
	.option(CLIConfigs.showSummary.key, CLIConfigs.showSummary.options)
	.option(CLIConfigs.stacktrace.key, CLIConfigs.stacktrace.options)
	.version("version", "Show version number", VERSION)
	.alias("v", "version")
	.help("help", "Show this help")
	.alias("h", "help")
	.group(
		[CLIConfigs.parallel.key, CLIConfigs.list.key, CLIConfigs.dryRun.key, CLIConfigs.showConfig.key, CLIConfigs.stacktrace.key],
		"Execution options:"
	)
	.group([CLIConfigs.configPath.key, CLIConfigs.logLevel.key, CLIConfigs.minWorkers.key, CLIConfigs.maxWorkers.key], "General options:")
	.group(["help", "version"], "Miscellaneous options:")
	.wrap(100)
	.strict()
	.parseSync();

new Nadle(resolveCLIConfigs(argv)).execute((argv as any).tasks ?? []);
