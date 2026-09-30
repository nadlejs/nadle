import c from "tinyrainbow";

export namespace TaskExplanation {
	export interface Props {
		/** Display label of the task being explained. */
		readonly label: string;
		/** Whether caching is enabled for this task. */
		readonly cachingEnabled: boolean;
		/** Declared input patterns of the task. */
		readonly inputs: readonly string[];
		/** Whether the task was requested directly on the command line. */
		readonly requestedDirectly: boolean;
		/** Labels of tasks that directly depend on this task. */
		readonly dependents: readonly string[];
		/** Dependency paths (root → … → task, as labels) that transitively pull the task in. */
		readonly pullPaths: readonly (readonly string[])[];
	}
}

/**
 * Render a static explanation of a single task: why it would run, what depends on
 * it, and its declared inputs. Pure — takes plain data so it can be unit-tested
 * without the scheduler or registry.
 */
export function renderTaskExplanation(props: TaskExplanation.Props): string {
	const lines: string[] = [`${c.bold("Task:")} ${props.label}`, ""];

	lines.push(c.bold("Why it runs:"));
	lines.push(...renderWhyItRuns(props));
	lines.push("");

	lines.push(c.bold("What depends on it:"));
	lines.push(...renderDependents(props.dependents));
	lines.push("");

	lines.push(c.bold("Inputs:"));
	lines.push(...renderInputs(props));

	return lines.join("\n");
}

function renderWhyItRuns({ pullPaths, requestedDirectly }: TaskExplanation.Props): string[] {
	const lines: string[] = [];

	if (requestedDirectly) {
		lines.push("  Requested directly on the command line.");
	}

	if (pullPaths.length > 0) {
		lines.push(requestedDirectly ? "  Also pulled in by:" : "  Pulled in by:");
		lines.push(...pullPaths.map((path) => `    ${path.join(" → ")}`));
	}

	if (lines.length === 0) {
		lines.push(c.dim("  Nothing requests this task; run it explicitly with `nadle <task>`."));
	}

	return lines;
}

function renderDependents(dependents: readonly string[]): string[] {
	if (dependents.length === 0) {
		return [c.dim("  Nothing depends on this task.")];
	}

	return dependents.map((dependent) => `  ${dependent}`);
}

function renderInputs({ inputs, cachingEnabled }: TaskExplanation.Props): string[] {
	if (inputs.length === 0) {
		return [c.dim("  No declared inputs (always runs; not cacheable).")];
	}

	const lines = inputs.map((input) => `  ${input}`);

	lines.push(
		cachingEnabled ? c.dim("  (caching enabled — a change to any input invalidates the cache)") : c.dim("  (caching disabled — the task always runs)")
	);

	return lines;
}
