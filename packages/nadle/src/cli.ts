import Process from "node:process";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { Nadle } from "./core/nadle.js";
import { CLIOptions } from "./core/options/cli-options.js";
import { CLIOptionsResolver } from "./core/options/cli-options-resolver.js";

// yargs completion callback signature is fixed (4 positional params).
// eslint-disable-next-line max-params
async function completeTaskNames(current: string, completionArgv: Record<string, unknown>, _filter: unknown, done: (completions: string[]) => void) {
	// Only contribute task names when completing a positional, not an option value.
	// Do NOT re-read `parser.argv` here — that re-enters this callback and recurses.
	if (current.startsWith("-")) {
		done([]);

		return;
	}

	try {
		const labels = await new Nadle(CLIOptionsResolver.resolve(completionArgv as Parameters<typeof CLIOptionsResolver.resolve>[0])).getTaskLabels();

		done(labels);
	} catch {
		// Completion must never surface errors; fall back to no task suggestions.
		done([]);
	}
}

const parser = yargs(hideBin(Process.argv))
	.scriptName("nadle")
	.command("$0 [tasks...]", "Execute one or more named tasks")

	.options({
		[CLIOptions.why.key]: CLIOptions.why.options,
		[CLIOptions.list.key]: CLIOptions.list.options,
		[CLIOptions.cache.key]: CLIOptions.cache.options,
		[CLIOptions.graph.key]: CLIOptions.graph.options,
		[CLIOptions.watch.key]: CLIOptions.watch.options,
		[CLIOptions.since.key]: CLIOptions.since.options,
		[CLIOptions.dryRun.key]: CLIOptions.dryRun.options,
		[CLIOptions.footer.key]: CLIOptions.footer.options,
		[CLIOptions.doctor.key]: CLIOptions.doctor.options,
		[CLIOptions.explain.key]: CLIOptions.explain.options,
		[CLIOptions.exclude.key]: CLIOptions.exclude.options,
		[CLIOptions.noCache.key]: CLIOptions.noCache.options,
		[CLIOptions.summary.key]: CLIOptions.summary.options,
		[CLIOptions.reporter.key]: CLIOptions.reporter.options,
		[CLIOptions.parallel.key]: CLIOptions.parallel.options,
		[CLIOptions.cacheDir.key]: CLIOptions.cacheDir.options,
		[CLIOptions.logLevel.key]: CLIOptions.logLevel.options,
		[CLIOptions.configKey.key]: CLIOptions.configKey.options,
		[CLIOptions.configFile.key]: CLIOptions.configFile.options,
		[CLIOptions.minWorkers.key]: CLIOptions.minWorkers.options,
		[CLIOptions.maxWorkers.key]: CLIOptions.maxWorkers.options,
		[CLIOptions.cleanCache.key]: CLIOptions.cleanCache.options,
		[CLIOptions.showConfig.key]: CLIOptions.showConfig.options,
		[CLIOptions.stacktrace.key]: CLIOptions.stacktrace.options,
		[CLIOptions.listWorkspaces.key]: CLIOptions.listWorkspaces.options
	})
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
			CLIOptions.listWorkspaces.key,
			CLIOptions.dryRun.key,
			CLIOptions.watch.key,
			CLIOptions.explain.key,
			CLIOptions.since.key,
			CLIOptions.showConfig.key,
			CLIOptions.configKey.key,
			CLIOptions.doctor.key,
			CLIOptions.stacktrace.key
		],
		"Execution options:"
	)

	.group(
		[
			CLIOptions.configFile.key,
			CLIOptions.cacheDir.key,
			CLIOptions.logLevel.key,
			CLIOptions.minWorkers.key,
			CLIOptions.maxWorkers.key,
			CLIOptions.footer.key,
			CLIOptions.summary.key,
			CLIOptions.why.key
		],
		"General options:"
	)
	.group(["help", "version"], "Miscellaneous options:")
	.completion("completion", "Print a shell completion script (bash/zsh/fish)", completeTaskNames)
	.example("nadle test -- -u", "Run the test task, passing -u through to its underlying command")
	.parserConfiguration({ "populate--": true })
	.wrap(100)
	.strict();

const argv = parser.parseSync();

// yargs handles the `completion` command and `--get-yargs-completions` internally
// (printing and exiting). Skip normal execution in that case.
const isCompletion = argv._[0] === "completion" || "get-yargs-completions" in argv;

if (!isCompletion) {
	new Nadle(CLIOptionsResolver.resolve(argv)).execute();
}
