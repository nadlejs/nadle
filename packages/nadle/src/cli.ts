import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

import yargs from "yargs";
import { createJiti } from "jiti";
import { hideBin } from "yargs/helpers";

import { runTask } from "./core/index.js";

const argv = yargs(hideBin(process.argv))
	.scriptName("nadle")
	.usage("$0 [...options] <tasks...>", "Run one or many tasks")
	.option("config", {
		alias: "c",
		type: "string",
		default: "build.nadle.ts",
		description: "Path to config file",
		defaultDescription: "<cwd>/build.nadle.ts"
	})
	.help()
	.parseSync();

const buildFile = resolve(process.cwd(), argv.config);

if (!existsSync(buildFile)) {
	console.error(`Config file not found: ${buildFile}`);
	// eslint-disable-next-line n/no-process-exit
	process.exit(1);
}

const jiti = createJiti(import.meta.url, {
	interopDefault: true,
	extensions: [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]
});

await jiti.import(pathToFileURL(buildFile).toString());

const tasks: string[] = argv.tasks as string[];

for (const task of tasks) {
	await runTask(task, {});
}
