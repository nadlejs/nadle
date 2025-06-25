import * as process from "node:process";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { Nadle } from "./core/nadle.js";
import { CLIOptions, resolveCLIOptions } from "./core/options/shared.js";

const argv = yargs(hideBin(process.argv))
	.scriptName("nadle")
	.command("$0 [tasks...]", "Execute one or more named tasks")

	.option(CLIOptions.configPath.key, CLIOptions.configPath.options)
	.option(CLIOptions.parallel.key, CLIOptions.parallel.options)
	.option(CLIOptions.minWorkers.key, CLIOptions.minWorkers.options)
	.option(CLIOptions.maxWorkers.key, CLIOptions.maxWorkers.options)
	.option(CLIOptions.exclude.key, CLIOptions.exclude.options)
	.option(CLIOptions.noCache.key, CLIOptions.noCache.options)
	.option(CLIOptions.cache.key, CLIOptions.cache.options)
	.option(CLIOptions.cacheDir.key, CLIOptions.cacheDir.options)
	.option(CLIOptions.cleanCache.key, CLIOptions.cleanCache.options)
	.option(CLIOptions.logLevel.key, CLIOptions.logLevel.options)
	.option(CLIOptions.list.key, CLIOptions.list.options)
	.option(CLIOptions.dryRun.key, CLIOptions.dryRun.options)
	.option(CLIOptions.showConfig.key, CLIOptions.showConfig.options)
	.option(CLIOptions.showSummary.key, CLIOptions.showSummary.options)
	.option(CLIOptions.stacktrace.key, CLIOptions.stacktrace.options)
	.version("version", "Show version number", Nadle.version)
	.alias("v", "version")
	.help("help", "Show this help")
	.alias("h", "help")
	.group(
		[
			CLIOptions.parallel.key,
			CLIOptions.exclude.key,
			CLIOptions.noCache.key,
			CLIOptions.cleanCache.key,
			CLIOptions.list.key,
			CLIOptions.dryRun.key,
			CLIOptions.showConfig.key,
			CLIOptions.stacktrace.key
		],
		"Execution options:"
	)

	.group(
		[CLIOptions.configPath.key, CLIOptions.cacheDir.key, CLIOptions.logLevel.key, CLIOptions.minWorkers.key, CLIOptions.maxWorkers.key],
		"General options:"
	)
	.group(["help", "version"], "Miscellaneous options:")
	.wrap(100)
	.strict()
	.parseSync();

new Nadle(resolveCLIOptions(argv)).execute((argv as any).tasks ?? []);
