import * as process from "node:process";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { Consola } from "./consola.js";
import { runner } from "./cli/runner.js";

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
	.option("list", { alias: "l", type: "boolean", description: "List all available tasks" })
	.help("help")
	.alias("help", "h")
	.parseSync();

runner(argv).catch((error) => {
	Consola.error(error);
	// eslint-disable-next-line n/no-process-exit
	process.exit(1);
});
