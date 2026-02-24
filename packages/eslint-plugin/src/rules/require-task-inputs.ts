import { ESLintUtils } from "@typescript-eslint/utils";

import { getTaskName, getConfigObject, isTasksRegisterCall } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

export default createRule({
	name: "require-task-inputs",
	meta: {
		schema: [],
		defaultOptions: [],
		type: "suggestion",
		docs: {
			description: "Require inputs when outputs are declared"
		},
		messages: {
			missingInputs: "Task '{{name}}' declares outputs but no inputs. Add inputs for proper caching."
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

				if (!configObject) {
					return;
				}

				const hasOutputs = configObject.properties.some(
					(prop) => prop.type === "Property" && prop.key.type === "Identifier" && prop.key.name === "outputs"
				);

				const hasInputs = configObject.properties.some(
					(prop) => prop.type === "Property" && prop.key.type === "Identifier" && prop.key.name === "inputs"
				);

				if (hasOutputs && !hasInputs) {
					context.report({
						node,
						data: { name },
						messageId: "missingInputs"
					});
				}
			}
		};
	}
});
