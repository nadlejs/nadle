import { ESLintUtils } from "@typescript-eslint/utils";

import { getTaskName, isTasksRegisterCall } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

export default createRule({
	defaultOptions: [],
	name: "no-duplicate-task-names",
	meta: {
		schema: [],
		type: "problem",
		docs: {
			description: "Prevent duplicate task names in the same file"
		},
		messages: {
			duplicate: "Task name '{{name}}' is already registered."
		}
	},
	create(context) {
		const seen = new Set<string>();

		return {
			CallExpression(node) {
				if (!isTasksRegisterCall(node)) {
					return;
				}

				const name = getTaskName(node);

				if (name === undefined) {
					return;
				}

				if (seen.has(name)) {
					context.report({
						node,
						data: { name },
						messageId: "duplicate"
					});

					return;
				}

				seen.add(name);
			}
		};
	}
});
