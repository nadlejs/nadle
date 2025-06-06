#!/usr/bin/env node
import * as process from "node:process";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { VERSION } from "./version.js";
import { Nadle } from "./core/index.js";
import { CLIOptions, resolveCLIOptions } from "./core/options/shared.js";

const argv = yargs(hideBin(process.argv))
	.scriptName("nadle")
	.command("$0 [tasks...]", "Execute one or more named tasks")

	.option(CLIOptions.configPath.key, CLIOptions.configPath.options)
	.option(CLIOptions.sequence.key, CLIOptions.sequence.options)
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
		[CLIOptions.sequence.key, CLIOptions.list.key, CLIOptions.dryRun.key, CLIOptions.showConfig.key, CLIOptions.stacktrace.key],
		"Execution options:"
	)
	.group([CLIOptions.configPath.key, CLIOptions.logLevel.key, CLIOptions.minWorkers.key, CLIOptions.maxWorkers.key], "General options:")
	.group(["help", "version"], "Miscellaneous options:")
	.wrap(100)
	.strict()
	.parseSync();

new Nadle(resolveCLIOptions(argv)).execute((argv as any).tasks ?? []);
