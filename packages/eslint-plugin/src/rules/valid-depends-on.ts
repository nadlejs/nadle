import { ESLintUtils, type TSESTree, AST_NODE_TYPES } from "@typescript-eslint/utils";
import { parseTaskReference, isWorkspaceQualified, VALID_TASK_NAME_PATTERN } from "@nadle/kernel";

import { getSpecObject, isTasksRegisterCall } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

export default createRule({
	name: "valid-depends-on",
	meta: {
		schema: [],
		type: "problem",
		defaultOptions: [],
		docs: {
			description: "Ensure dependsOn values are valid task references"
		},
		messages: {
			invalidDependsOn: "dependsOn must be a string or an array of strings.",
			invalidDependencyName:
				"Dependency '{{name}}' is not a valid task name. " + "Names must start with a letter and contain only alphanumeric characters and hyphens.",
			invalidWorkspaceRef:
				"Dependency '{{ref}}' has an invalid workspace-qualified format. " +
				"Expected 'workspace:task' where both parts are non-empty and the task name is valid."
		}
	},
	create(context) {
		return {
			CallExpression(node) {
				if (!isTasksRegisterCall(node)) {
					return;
				}

				const specObject = getSpecObject(node);

				if (!specObject) {
					return;
				}

				const dependsOnProp = specObject.properties.find(
					(prop) => prop.type === AST_NODE_TYPES.Property && prop.key.type === AST_NODE_TYPES.Identifier && prop.key.name === "dependsOn"
				);

				if (!dependsOnProp || dependsOnProp.type !== AST_NODE_TYPES.Property) {
					return;
				}

				const value = dependsOnProp.value;

				if (isStringLiteral(value)) {
					validateDepRef(context, value);

					return;
				}

				if (value.type === AST_NODE_TYPES.ArrayExpression) {
					let hasNonString = false;

					for (const element of value.elements) {
						if (element === null || !isStringLiteral(element)) {
							hasNonString = true;
							continue;
						}

						validateDepRef(context, element);
					}

					if (hasNonString) {
						context.report({ node: value, messageId: "invalidDependsOn" });
					}

					return;
				}

				context.report({ node: value, messageId: "invalidDependsOn" });
			}
		};
	}
});

type RuleContext = Parameters<Parameters<typeof createRule>[0]["create"]>[0];

function validateDepRef(context: Readonly<RuleContext>, node: TSESTree.StringLiteral): void {
	const ref = String(node.value);

	if (isWorkspaceQualified(ref)) {
		const { taskName, workspaceInput } = parseTaskReference(ref);

		if (!workspaceInput || !VALID_TASK_NAME_PATTERN.test(taskName)) {
			context.report({ node, data: { ref }, messageId: "invalidWorkspaceRef" });
		}

		return;
	}

	if (!VALID_TASK_NAME_PATTERN.test(ref)) {
		context.report({ node, data: { name: ref }, messageId: "invalidDependencyName" });
	}
}

function isStringLiteral(node: { type: string; value?: unknown }): node is TSESTree.StringLiteral {
	return node.type === AST_NODE_TYPES.Literal && typeof node.value === "string";
}
