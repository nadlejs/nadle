import { ESLintUtils } from "@typescript-eslint/utils";

import { getTaskName, getConfigObject, isTasksRegisterCall } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

export default createRule({
	name: "require-task-description",
	meta: {
		schema: [],
		defaultOptions: [],
		type: "suggestion",
		docs: {
			description: "Require task descriptions"
		},
		messages: {
			missingConfig: "Task '{{name}}' has no .config() call. Add .config({ description: \"...\" }).",
			missingDescription: "Task '{{name}}' is missing a description. Add a description property in .config()."
		}
	},
	create(context) {
		return {
			CallExpression(node) {
				if (!isTasksRegisterCall(node)) {
					return;
				}

				const name = getTaskName(node);

				if (name === undefined) {
					return;
				}

				const configObject = getConfigObject(node);

				if (configObject === undefined) {
					context.report({
						node,
						data: { name },
						messageId: "missingConfig"
					});

					return;
				}

				const hasDescription = configObject.properties.some(
					(prop) => prop.type === "Property" && prop.key.type === "Identifier" && prop.key.name === "description"
				);

				if (!hasDescription) {
					context.report({
						data: { name },
						node: configObject,
						messageId: "missingDescription"
					});
				}
			}
		};
	}
});
