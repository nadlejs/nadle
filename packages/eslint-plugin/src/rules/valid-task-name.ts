import { ESLintUtils } from "@typescript-eslint/utils";
import { VALID_TASK_NAME_PATTERN } from "@nadle/kernel";

import { getTaskName, isTasksRegisterCall } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

export default createRule({
	name: "valid-task-name",
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

				if (!VALID_TASK_NAME_PATTERN.test(name)) {
					context.report({ node, data: { name }, messageId: "invalidName" });
				}
			}
		};
	},
	meta: {
		schema: [],
		type: "problem",
		defaultOptions: [],
		docs: {
			description: "Enforce valid task naming pattern"
		},
		messages: {
			invalidName:
				"Task name '{{name}}' does not match the required pattern. Names must start with a lowercase letter and contain only alphanumeric characters and hyphens (e.g., 'my-task' or 'myTask')."
		}
	}
});
