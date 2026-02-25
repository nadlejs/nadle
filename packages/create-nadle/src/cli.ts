/* eslint-disable no-console */
import Path from "node:path";
import Fs from "node:fs/promises";
import Process from "node:process";

import meow from "meow";
import { execa } from "execa";

import { runWizard } from "./wizard.js";
import { detectProject } from "./detect.js";
import { generateConfig } from "./generate.js";
import type { PackageManager, ProjectContext } from "./types.js";

const cli = meow(
	`
  Usage
    $ create-nadle

  Options
    --yes, -y  Skip prompts and use defaults

  Examples
    $ npm create nadle
    $ pnpm create nadle -- --yes
`,
	{
		importMeta: import.meta,
		flags: {
			yes: { shortFlag: "y", default: false, type: "boolean" }
		}
	}
);

function isInteractive(): boolean {
	return !cli.flags.yes && Boolean(Process.stdin.isTTY);
}

function getInstallArgs(pm: PackageManager): string[] {
	if (pm === "pnpm") {
		return ["install", "nadle", "-D"];
	}

	if (pm === "yarn") {
		return ["add", "nadle", "-D", "-W"];
	}

	return ["install", "nadle", "--save-dev"];
}

async function installNadle(context: ProjectContext): Promise<void> {
	const args = getInstallArgs(context.packageManager);

	console.log(`\u2713 Installing nadle...`);
	await execa(context.packageManager, args, {
		stdio: "inherit",
		cwd: context.rootDir
	});
}

async function writeConfig(rootDir: string, content: string): Promise<void> {
	const configPath = Path.join(rootDir, "nadle.config.ts");

	await Fs.writeFile(configPath, content, "utf8");
	console.log(`\u2713 Wrote nadle.config.ts`);
}

function printDetectionSummary(context: ProjectContext): void {
	console.log(`\u2713 Detected project root: ${context.rootDir}`);
	console.log(`\u2713 Detected package manager: ${context.packageManager}`);

	if (context.hasTypeScript) {
		console.log(`\u2713 Detected TypeScript project`);
	}

	if (context.isMonorepo) {
		console.log(`\u2713 Detected monorepo`);
	}

	const migratable = context.scripts.filter((s) => s.category === "task" || s.category === "pre-post");

	if (migratable.length > 0) {
		const names = migratable.map((s) => s.name).join(", ");
		console.log(`\u2713 Auto-migrating ${migratable.length} task-like scripts (${names})`);
	}
}

async function runNonInteractive(cwd: string): Promise<void> {
	const context = await detectProject(cwd);

	printDetectionSummary(context);

	if (context.hasConfig) {
		console.log(`\u26a0 nadle.config.ts already exists \u2014 skipping config generation.`);

		return;
	}

	const taskScripts = context.scripts.filter((s) => s.category === "task" || s.category === "pre-post");
	const config = generateConfig(context, taskScripts);

	if (!context.hasNadle) {
		await installNadle(context);
	}

	await writeConfig(context.rootDir, config);
	console.log(`\u2713 Project ready! Run \`nadle build\` to get started.`);
}

async function runInteractive(cwd: string): Promise<void> {
	const context = await detectProject(cwd);
	const answers = await runWizard(context, cwd);

	if (answers === null) {
		return;
	}

	const selected = context.scripts.filter((s) => answers.selectedScripts.includes(s.name));
	const config = generateConfig(context, selected);

	if (!context.hasNadle) {
		await installNadle(context);
	}

	await writeConfig(context.rootDir, config);
	console.log(`\u2713 Project ready! Run \`nadle build\` to get started.`);
}

async function main(): Promise<void> {
	const cwd = Process.cwd();

	if (isInteractive()) {
		await runInteractive(cwd);
	} else {
		await runNonInteractive(cwd);
	}
}

main().catch((err: unknown) => {
	const message = err instanceof Error ? err.message : String(err);
	console.error(`\u2717 Failed to create project: ${message}`);

	Process.exit(1);
});
