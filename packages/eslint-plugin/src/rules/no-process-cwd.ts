import { ESLintUtils } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { isInTaskAction } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

export default createRule({
	defaultOptions: [],
	name: "no-process-cwd",
	meta: {
		schema: [],
		type: "suggestion",
		docs: {
			description: "Disallow process.cwd() in task actions"
		},
		messages: {
			noProcessCwd: "Avoid process.cwd() in task actions. Use context.workingDir instead."
		}
	},
	create(context) {
		return {
			CallExpression(node) {
				if (
					node.callee.type !== AST_NODE_TYPES.MemberExpression ||
					node.callee.object.type !== AST_NODE_TYPES.Identifier ||
					node.callee.object.name !== "process" ||
					node.callee.property.type !== AST_NODE_TYPES.Identifier ||
					node.callee.property.name !== "cwd"
				) {
					return;
				}

				if (!isInTaskAction(node)) {
					return;
				}

				context.report({ node, messageId: "noProcessCwd" });
			}
		};
	}
});
