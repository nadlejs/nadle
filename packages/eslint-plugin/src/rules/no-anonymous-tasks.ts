import { ESLintUtils } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { isTasksRegisterCall } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

export default createRule({
	name: "no-anonymous-tasks",
	meta: {
		schema: [],
		type: "problem",
		defaultOptions: [],
		docs: {
			description: "Require string literal names in task registration"
		},
		messages: {
			anonymous: 'Task registered without a string literal name. Use tasks.register("name", ...) instead.'
		}
	},
	create(context) {
		return {
			CallExpression(node) {
				if (!isTasksRegisterCall(node)) {
					return;
				}

				const firstArg = node.arguments[0];

				if (!firstArg || firstArg.type !== AST_NODE_TYPES.Literal || typeof firstArg.value !== "string") {
					context.report({ node, messageId: "anonymous" });
				}
			}
		};
	}
});
