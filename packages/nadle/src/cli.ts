#!/usr/bin/env node

import { resolve } from "path";
import { existsSync } from "fs";
import { pathToFileURL } from "url";

import { cac } from "cac";
import { createJiti } from "jiti";

import { runTask, getRegisteredTasks } from "./core/task.js";

const buildFile = resolve(process.cwd(), "build.ts");

if (!existsSync(buildFile)) {
	console.error("No build.ts found in current directory");
	process.exit(1);
}

const jiti = createJiti(import.meta.url, {
	interopDefault: true,
	extensions: [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]
});

await jiti.import(pathToFileURL(buildFile).toString());

const cli = cac("nadle");

for (const taskName of getRegisteredTasks()) {
	cli.command(taskName, `Run "${taskName}" task`).action(async () => {
		await runTask(taskName);
	});
}

cli.help();
cli.parse();
