import * as p from "@clack/prompts";

import type { ScriptEntry, WizardAnswers, ProjectContext } from "./types.js";

function formatScriptLabel(script: ScriptEntry): string {
	const tag = script.category === "long-running" ? " [long-running]" : "";

	return `${script.name} (${script.command})${tag}`;
}

function buildScriptOptions(context: ProjectContext): Array<{
	value: string;
	label: string;
	hint?: string;
	initialValue?: boolean;
}> {
	const nonLifecycle = context.scripts.filter((s) => s.category !== "lifecycle" && s.category !== "pre-post");

	return nonLifecycle.map((script) => ({
		value: script.name,
		label: formatScriptLabel(script),
		initialValue: script.category === "task",
		hint: script.category === "long-running" ? "excluded by default" : undefined
	}));
}

async function confirmRoot(context: ProjectContext, cwd: string): Promise<boolean> {
	if (cwd === context.rootDir) {
		return true;
	}

	const result = await p.confirm({
		message: `Detected project root: ${context.rootDir}. Continue?`
	});

	if (p.isCancel(result)) {
		return false;
	}

	return result;
}

async function confirmOverwrite(): Promise<boolean> {
	const result = await p.confirm({
		message: "nadle.config.ts already exists. Overwrite?"
	});

	if (p.isCancel(result)) {
		return false;
	}

	return result;
}

async function selectScripts(context: ProjectContext): Promise<string[] | null> {
	const options = buildScriptOptions(context);

	if (options.length === 0) {
		return [];
	}

	const result = await p.multiselect({
		options,
		message: "Select scripts to migrate as nadle tasks"
	});

	if (p.isCancel(result)) {
		return null;
	}

	return result;
}

/** Run the interactive setup wizard. Returns null if user cancels. */
export async function runWizard(context: ProjectContext, cwd: string): Promise<WizardAnswers | null> {
	p.intro("create-nadle");

	const rootConfirmed = await confirmRoot(context, cwd);

	if (!rootConfirmed) {
		p.cancel("Setup cancelled.");

		return null;
	}

	if (context.hasConfig) {
		const overwrite = await confirmOverwrite();

		if (!overwrite) {
			p.cancel("Keeping existing config.");

			return null;
		}
	}

	const selected = await selectScripts(context);

	if (selected === null) {
		p.cancel("Setup cancelled.");

		return null;
	}

	return {
		confirmRoot: true,
		selectedScripts: selected,
		overwriteConfig: context.hasConfig
	};
}
