import c from "tinyrainbow";

export namespace TaskGraph {
	export interface Node {
		readonly id: string;
		readonly label: string;
		/** Direct dependency task ids (both explicit and implicit). */
		readonly dependencies: readonly string[];
		/** Subset of `dependencies` that were derived implicitly (e.g. from workspace deps). */
		readonly implicitDependencies: readonly string[];
	}

	export interface Props {
		readonly nodes: readonly Node[];
		/** Root task ids the user requested — the entry points of the printed forest. */
		readonly roots: readonly string[];
		readonly format: "tree" | "mermaid";
	}
}

/**
 * Render the resolved task dependency graph as text. The `tree` format prints an
 * indented forest rooted at the requested tasks; the `mermaid` format emits a
 * Mermaid `graph TD` block suitable for pasting into docs.
 */
export function renderTaskGraph({ roots, nodes, format }: TaskGraph.Props): string {
	const byId = new Map(nodes.map((node) => [node.id, node]));

	return format === "mermaid" ? renderMermaid(roots, byId) : renderTree(roots, byId);
}

interface Frame {
	readonly id: string;
	readonly prefix: string;
	readonly isLast: boolean;
	readonly isRoot: boolean;
	readonly ancestors: Set<string>;
}

function renderTree(roots: readonly string[], byId: Map<string, TaskGraph.Node>): string {
	const lines: string[] = [c.bold("Task graph:")];

	const visit = ({ id, prefix, isLast, isRoot, ancestors }: Frame): void => {
		const node = byId.get(id);
		const label = node ? node.label : id;

		lines.push(isRoot ? c.bold(label) : `${prefix}${isLast ? "└─ " : "├─ "}${label}`);

		// A cycle would be a config error caught earlier, but guard the renderer anyway.
		if (ancestors.has(id)) {
			lines.push(`${prefix}${isRoot ? "" : isLast ? "   " : "│  "}${c.red("↻ cycle")}`);

			return;
		}

		if (!node) {
			return;
		}

		const childPrefix = isRoot ? "" : prefix + (isLast ? "   " : "│  ");
		const nextAncestors = new Set(ancestors).add(id);

		node.dependencies.forEach((depId, index) => {
			const beforeLen = lines.length;

			visit({ id: depId, isRoot: false, prefix: childPrefix, ancestors: nextAncestors, isLast: index === node.dependencies.length - 1 });

			if (node.implicitDependencies.includes(depId)) {
				lines[beforeLen] += c.dim(" (implicit)");
			}
		});
	};

	for (const rootId of roots) {
		visit({ id: rootId, prefix: "", isLast: true, isRoot: true, ancestors: new Set() });
	}

	return lines.join("\n");
}

function renderMermaid(roots: readonly string[], byId: Map<string, TaskGraph.Node>): string {
	const lines: string[] = ["```mermaid", "graph TD"];
	const seen = new Set<string>();
	const queue = [...roots];
	const ids = new Map<string, string>();
	let counter = 0;

	const mermaidId = (taskId: string): string => {
		let id = ids.get(taskId);

		if (id === undefined) {
			id = `t${counter++}`;
			ids.set(taskId, id);
		}

		return id;
	};

	while (queue.length > 0) {
		const taskId = queue.shift()!;

		if (seen.has(taskId)) {
			continue;
		}

		seen.add(taskId);

		const node = byId.get(taskId);
		const label = node ? node.label : taskId;
		lines.push(`  ${mermaidId(taskId)}["${label}"]`);

		for (const depId of node?.dependencies ?? []) {
			const arrow = node?.implicitDependencies.includes(depId) ? "-.->" : "-->";
			lines.push(`  ${mermaidId(taskId)} ${arrow} ${mermaidId(depId)}`);
			queue.push(depId);
		}
	}

	lines.push("```");

	return lines.join("\n");
}
