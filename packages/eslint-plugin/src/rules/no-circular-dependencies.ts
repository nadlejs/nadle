import { ESLintUtils, type TSESTree, AST_NODE_TYPES } from "@typescript-eslint/utils";

import { getTaskName, getConfigObject, isTasksRegisterCall } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

interface GraphEntry {
	deps: string[];
	node: TSESTree.Node;
}

export default createRule({
	defaultOptions: [],
	name: "no-circular-dependencies",
	meta: {
		schema: [],
		type: "problem",
		docs: {
			description: "Detect circular task dependency chains"
		},
		messages: {
			circular: "Circular dependency detected: {{cycle}}"
		}
	},
	create(context) {
		const graph = new Map<string, GraphEntry>();

		return {
			CallExpression(node) {
				if (!isTasksRegisterCall(node)) {
					return;
				}

				const taskName = getTaskName(node);

				if (!taskName) {
					return;
				}

				const configObj = getConfigObject(node);

				if (!configObj) {
					if (!graph.has(taskName)) {
						graph.set(taskName, { node, deps: [] });
					}

					return;
				}

				const { deps, dependsOnNode } = extractDependsOn(configObj);
				graph.set(taskName, { deps, node: dependsOnNode ?? node });
			},

			"Program:exit"() {
				detectCycles(graph, context);
			}
		};
	}
});

function extractDependsOn(configObj: TSESTree.ObjectExpression): {
	deps: string[];
	dependsOnNode: TSESTree.Node | undefined;
} {
	const deps: string[] = [];
	let dependsOnNode: TSESTree.Node | undefined;

	for (const prop of configObj.properties) {
		if (prop.type !== AST_NODE_TYPES.Property || prop.key.type !== AST_NODE_TYPES.Identifier || prop.key.name !== "dependsOn") {
			continue;
		}

		dependsOnNode = prop;

		if (prop.value.type !== AST_NODE_TYPES.ArrayExpression) {
			break;
		}

		for (const element of prop.value.elements) {
			if (element?.type === AST_NODE_TYPES.Literal && typeof element.value === "string") {
				deps.push(element.value);
			}
		}

		break;
	}

	return { deps, dependsOnNode };
}

type VisitState = "visiting" | "visited";

function detectCycles(graph: Map<string, GraphEntry>, context: Readonly<Parameters<Parameters<typeof createRule>[0]["create"]>[0]>): void {
	const state = new Map<string, VisitState>();
	const path: string[] = [];

	function dfs(taskName: string): boolean {
		const current = state.get(taskName);

		if (current === "visited") {
			return false;
		}

		if (current === "visiting") {
			const cycleStart = path.indexOf(taskName);
			const cycle = [...path.slice(cycleStart), taskName].join(" -> ");
			const entry = graph.get(path[cycleStart]!);

			if (entry) {
				context.report({
					data: { cycle },
					node: entry.node,
					messageId: "circular"
				});
			}

			return true;
		}

		state.set(taskName, "visiting");
		path.push(taskName);

		const entry = graph.get(taskName);

		if (entry) {
			for (const dep of entry.deps) {
				if (dfs(dep)) {
					return true;
				}
			}
		}

		path.pop();
		state.set(taskName, "visited");

		return false;
	}

	for (const taskName of graph.keys()) {
		if (!state.has(taskName)) {
			dfs(taskName);
		}
	}
}
