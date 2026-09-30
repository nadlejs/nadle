import { ESLintUtils } from "@typescript-eslint/utils";
import { type TSESTree, AST_NODE_TYPES } from "@typescript-eslint/utils";

import { isTasksRegisterCall } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

/** Check if an expression statement is a `tasks.register()` call. */
function isTaskRegistrationStatement(node: TSESTree.ExpressionStatement): boolean {
	const expr = node.expression;

	return expr.type === AST_NODE_TYPES.CallExpression && isTasksRegisterCall(expr);
}

export default createRule({
	name: "padding-between-tasks",
	meta: {
		schema: [],
		type: "layout",
		defaultOptions: [],
		fixable: "whitespace",
		docs: {
			description: "Enforce empty lines between task registrations"
		},
		messages: {
			needsPadding: "Expected an empty line between task registrations."
		}
	},
	create(context) {
		return {
			Program(program) {
				let previousTaskStatement: TSESTree.ExpressionStatement | undefined;

				for (const statement of program.body) {
					if (statement.type !== AST_NODE_TYPES.ExpressionStatement || !isTaskRegistrationStatement(statement)) {
						previousTaskStatement = undefined;
						continue;
					}

					if (previousTaskStatement) {
						const previousEnd = previousTaskStatement.loc.end.line;
						const currentStart = statement.loc.start.line;

						if (currentStart - previousEnd <= 1) {
							context.report({
								node: statement,
								messageId: "needsPadding",
								fix(fixer) {
									return fixer.insertTextBefore(statement, "\n");
								}
							});
						}
					}

					previousTaskStatement = statement;
				}
			}
		};
	}
});
