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
 * Returns the keyed spec object (2nd arg of `tasks.register(name, spec)`), or `undefined`
 * for shorthands (`register(name)`, `register(name, fn)`) and lazy/dynamic configs
 * (`register(name, lazy(() => ({ ... })))`), which are not statically analyzable.
 */
export function getSpecObject(node: TSESTree.CallExpression): TSESTree.ObjectExpression | undefined {
	const second = node.arguments[1];

	return second?.type === AST_NODE_TYPES.ObjectExpression ? second : undefined;
}

/**
 * Check if a node is inside a task action scope.
 * Task actions are:
 * 1. The second argument to `tasks.register(name, fn)` (function shorthand)
 * 2. The `run` property value of the keyed spec in `tasks.register(name, { run: fn })`
 * 3. Functions nested inside those task action functions
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

/**
 * Check if a node is a task action function: either the second argument of
 * `tasks.register(name, fn)`, or the `run` property value of the keyed spec in
 * `tasks.register(name, { run: fn })`.
 */
function isTaskActionFunction(node: TSESTree.Node): boolean {
	if (node.type !== AST_NODE_TYPES.ArrowFunctionExpression && node.type !== AST_NODE_TYPES.FunctionExpression) {
		return false;
	}

	const parent = node.parent;

	// Function shorthand: tasks.register(name, fn)
	if (parent?.type === AST_NODE_TYPES.CallExpression && parent.arguments[1] === node) {
		return isTasksRegisterCall(parent);
	}

	// Keyed spec: tasks.register(name, { run: fn })
	if (
		parent?.type === AST_NODE_TYPES.Property &&
		parent.key.type === AST_NODE_TYPES.Identifier &&
		parent.key.name === "run" &&
		parent.value === node
	) {
		const specObject = parent.parent;

		if (specObject?.type === AST_NODE_TYPES.ObjectExpression) {
			const registerCall = specObject.parent;

			if (registerCall?.type === AST_NODE_TYPES.CallExpression && registerCall.arguments[1] === specObject && isTasksRegisterCall(registerCall)) {
				return true;
			}
		}
	}

	return false;
}
