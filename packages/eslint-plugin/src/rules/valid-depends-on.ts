import { ESLintUtils } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { isTasksRegisterCall } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

export default createRule({
	defaultOptions: [],
	name: "valid-depends-on",
	meta: {
		schema: [],
		type: "problem",
		docs: {
			description: "Ensure dependsOn values are strings or string arrays"
		},
		messages: {
			invalidDependsOn: "dependsOn must be a string or an array of strings."
		}
	},
	create(context) {
		return {
			CallExpression(node) {
				if (!isConfigCallOnRegister(node)) {
					return;
				}

				const configArg = node.arguments[0];

				if (!configArg || configArg.type !== AST_NODE_TYPES.ObjectExpression) {
					return;
				}

				const dependsOnProp = configArg.properties.find(
					(prop) => prop.type === AST_NODE_TYPES.Property && prop.key.type === AST_NODE_TYPES.Identifier && prop.key.name === "dependsOn"
				);

				if (!dependsOnProp || dependsOnProp.type !== AST_NODE_TYPES.Property) {
					return;
				}

				const value = dependsOnProp.value;

				if (isStringLiteral(value)) {
					return;
				}

				if (value.type === AST_NODE_TYPES.ArrayExpression) {
					const allStrings = value.elements.every((element) => element !== null && isStringLiteral(element));

					if (allStrings) {
						return;
					}
				}

				context.report({ node: dependsOnProp.value, messageId: "invalidDependsOn" });
			}
		};
	}
});

function isConfigCallOnRegister(node: Parameters<typeof isTasksRegisterCall>[0]): boolean {
	const callee = node.callee;

	if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.property.type !== AST_NODE_TYPES.Identifier || callee.property.name !== "config") {
		return false;
	}

	const object = callee.object;

	if (object.type !== AST_NODE_TYPES.CallExpression) {
		return false;
	}

	return isTasksRegisterCall(object);
}

function isStringLiteral(node: { type: string; value?: unknown }): boolean {
	return node.type === AST_NODE_TYPES.Literal && typeof node.value === "string";
}
