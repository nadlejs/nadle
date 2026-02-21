import { type TSESTree, AST_NODE_TYPES } from "@typescript-eslint/utils";

/** Check if a node is a `tasks.register(...)` call expression. */
export function isTasksRegisterCall(node: TSESTree.CallExpression): boolean {
	return (
		node.callee.type === AST_NODE_TYPES.MemberExpression &&
		node.callee.object.type === AST_NODE_TYPES.Identifier &&
		node.callee.object.name === "tasks" &&
		node.callee.property.type === AST_NODE_TYPES.Identifier &&
		node.callee.property.name === "register"
	);
}

/** Extract the task name from a `tasks.register(name, ...)` call. Returns `undefined` if not a string literal. */
export function getTaskName(node: TSESTree.CallExpression): string | undefined {
	const firstArg = node.arguments[0];

	if (firstArg?.type === AST_NODE_TYPES.Literal && typeof firstArg.value === "string") {
		return firstArg.value;
	}

	return undefined;
}

/**
 * Find the `.config(obj)` call chained on a `tasks.register()` result.
 * Pattern: `tasks.register(...).config({ ... })`
 * Returns the object expression argument, or `undefined`.
 */
export function getConfigObject(node: TSESTree.CallExpression): TSESTree.ObjectExpression | undefined {
	if (
		node.parent?.type === AST_NODE_TYPES.MemberExpression &&
		node.parent.property.type === AST_NODE_TYPES.Identifier &&
		node.parent.property.name === "config" &&
		node.parent.parent?.type === AST_NODE_TYPES.CallExpression
	) {
		const configCall = node.parent.parent;
		const arg = configCall.arguments[0];

		if (arg?.type === AST_NODE_TYPES.ObjectExpression) {
			return arg;
		}
	}

	return undefined;
}

/**
 * Check if a node is inside a task action scope.
 * Task actions are:
 * 1. The second argument to `tasks.register(name, fn)`
 * 2. Functions nested inside those task action functions
 */
export function isInTaskAction(node: TSESTree.Node): boolean {
	let current: TSESTree.Node | undefined = node.parent;

	while (current) {
		if (isTaskActionFunction(current)) {
			return true;
		}

		current = current.parent;
	}

	return false;
}

/** Check if a node is a task action function (second arg of tasks.register). */
function isTaskActionFunction(node: TSESTree.Node): boolean {
	if (node.type !== AST_NODE_TYPES.ArrowFunctionExpression && node.type !== AST_NODE_TYPES.FunctionExpression) {
		return false;
	}

	const parent = node.parent;

	if (parent?.type !== AST_NODE_TYPES.CallExpression) {
		return false;
	}

	// Must be the second argument: tasks.register(name, fn)
	if (parent.arguments[1] !== node) {
		return false;
	}

	return isTasksRegisterCall(parent);
}
