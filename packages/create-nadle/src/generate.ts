import type { ScriptEntry, ProjectContext } from "./types.js";

const TASK_TYPE_IMPORTS = new Set(["ExecTask", "PnpmTask", "NpmTask", "NpxTask", "PnpxTask", "NodeTask", "DeleteTask", "CopyTask"]);

function collectImports(scripts: ScriptEntry[], isMonorepo: boolean): { nadle: string[]; taskTypes: string[] } {
	const nadle = new Set<string>(["tasks"]);
	const taskTypes = new Set<string>();

	if (isMonorepo) {
		nadle.add("configure");
	}

	for (const script of scripts) {
		if (TASK_TYPE_IMPORTS.has(script.taskType)) {
			taskTypes.add(script.taskType);
		}
	}

	return {
		nadle: [...nadle].sort(),
		taskTypes: [...taskTypes].sort()
	};
}

function renderImports(nadleImports: string[], taskTypes: string[]): string {
	const all = [...nadleImports, ...taskTypes];

	return `import { ${all.join(", ")} } from "nadle";\n`;
}

function renderConfigure(context: ProjectContext): string {
	if (!context.isMonorepo) {
		return "";
	}

	return `\nconfigure({\n\timplicitDependencies: true,\n});\n`;
}

function renderTaskRegistration(script: ScriptEntry): string {
	if (TASK_TYPE_IMPORTS.has(script.taskType)) {
		return renderBuiltinTask(script);
	}

	return renderInlineTask(script);
}

function renderBuiltinTask(script: ScriptEntry): string {
	const options = buildTaskOptions(script);
	const configFields = buildConfigFields(script);
	const fields = [`run: ${script.taskType}`, `options: ${options}`, ...configFields];

	return `tasks.register("${script.nadleTaskName}", { ${fields.join(", ")} });\n`;
}

function buildTaskOptions(script: ScriptEntry): string {
	switch (script.taskType) {
		case "ExecTask":
		case "NpxTask":
		case "PnpxTask":
			return formatExecOptions(script);
		case "NodeTask":
			return formatNodeOptions(script);
		case "DeleteTask":
			return formatDeleteOptions(script);
		case "PnpmTask":
		case "NpmTask":
			return formatPmOptions(script);
		default:
			return "{}";
	}
}

function formatExecOptions(script: ScriptEntry): string {
	const args = script.parsedArgs;

	if (args.length === 0) {
		return `{ command: "${script.parsedCommand}" }`;
	}

	const argsStr = args.map((a) => `"${a}"`).join(", ");

	return `{ command: "${script.parsedCommand}", args: [${argsStr}] }`;
}

function formatNodeOptions(script: ScriptEntry): string {
	const scriptPath = script.parsedArgs[0] ?? "";
	const rest = script.parsedArgs.slice(1);

	if (rest.length === 0) {
		return `{ script: "${scriptPath}" }`;
	}

	const argsStr = rest.map((a) => `"${a}"`).join(", ");

	return `{ script: "${scriptPath}", args: [${argsStr}] }`;
}

function formatDeleteOptions(script: ScriptEntry): string {
	const paths = script.parsedArgs.join(" ");

	return `{ paths: "${paths}" }`;
}

function formatPmOptions(script: ScriptEntry): string {
	const args = script.parsedArgs;

	if (args.length === 1) {
		return `{ args: "${args[0]}" }`;
	}

	const argsStr = args.map((a) => `"${a}"`).join(", ");

	return `{ args: [${argsStr}] }`;
}

function buildConfigFields(script: ScriptEntry): string[] {
	const parts: string[] = [];

	if (script.dependsOn.length > 0) {
		const deps = script.dependsOn.map((d) => `"${d}"`).join(", ");
		parts.push(`dependsOn: [${deps}]`);
	}

	if (Object.keys(script.envVars).length > 0) {
		const entries = Object.entries(script.envVars)
			.map(([k, v]) => `${k}: "${v}"`)
			.join(", ");
		parts.push(`env: { ${entries} }`);
	}

	return parts;
}

function renderInlineTask(script: ScriptEntry): string {
	const configFields = buildConfigFields(script);

	if (configFields.length === 0) {
		return `tasks.register("${script.nadleTaskName}", async () => {\n\t// TODO: review this migrated script\n\t// Original: ${script.command}\n});\n`;
	}

	const run = `async () => {\n\t\t// TODO: review this migrated script\n\t\t// Original: ${script.command}\n\t}`;
	const fields = [`run: ${run}`, ...configFields].map((field) => `\t${field}`).join(",\n");

	return `tasks.register("${script.nadleTaskName}", {\n${fields}\n});\n`;
}

function renderDefaultTask(hasTypeScript: boolean): string {
	if (hasTypeScript) {
		return `tasks.register("build", { run: ExecTask, options: { command: "tsc" } });\n`;
	}

	return `tasks.register("build", async () => {\n\tconsole.log("Building project...");\n});\n`;
}

/** Generate a complete nadle.config.ts file content. */
export function generateConfig(context: ProjectContext, selectedScripts: ScriptEntry[]): string {
	const { nadle, taskTypes } = collectImports(selectedScripts, context.isMonorepo);

	if (selectedScripts.length === 0 && context.hasTypeScript) {
		taskTypes.push("ExecTask");
	}

	const allNadle = [...new Set(nadle)];
	const allTypes = [...new Set(taskTypes)].sort();

	const lines: string[] = [];

	lines.push(renderImports(allNadle, allTypes));
	lines.push(renderConfigure(context));

	if (selectedScripts.length === 0) {
		lines.push(renderDefaultTask(context.hasTypeScript));
	} else {
		for (const script of selectedScripts) {
			lines.push(renderTaskRegistration(script));
		}
	}

	return lines.filter(Boolean).join("\n");
}
