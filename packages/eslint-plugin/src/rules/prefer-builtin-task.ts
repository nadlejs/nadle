import { ESLintUtils } from "@typescript-eslint/utils";
import { type TSESTree } from "@typescript-eslint/utils";

import { isInTaskAction } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

type MessageId = "preferExec" | "preferPnpm" | "preferCopy" | "preferDelete";

const EXEC_APIS = new Set(["execa", "exec", "execFile", "spawn"]);

const COPY_APIS = new Set(["cp", "copyFile"]);

const DELETE_APIS = new Set(["rm", "rmdir", "unlink", "rimraf"]);

/** Extract the called function name from a CallExpression callee. */
function getCalledName(callee: TSESTree.CallExpression["callee"]): { name: string; isMember: boolean } | undefined {
	if (callee.type === "Identifier") {
		return { isMember: false, name: callee.name };
	}

	if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
		return { isMember: true, name: callee.property.name };
	}

	return undefined;
}

/** Get the full qualified name for reporting (e.g. "fs.cp" or "execa"). */
function getDisplayName(callee: TSESTree.CallExpression["callee"]): string {
	if (callee.type === "Identifier") {
		return callee.name;
	}

	if (callee.type === "MemberExpression" && callee.object.type === "Identifier" && callee.property.type === "Identifier") {
		return `${callee.object.name}.${callee.property.name}`;
	}

	return "unknown";
}

/** Check if the first argument is the string literal "pnpm". */
function hasPnpmFirstArg(node: TSESTree.CallExpression): boolean {
	const firstArg = node.arguments[0];

	return firstArg?.type === "Literal" && typeof firstArg.value === "string" && firstArg.value === "pnpm";
}

/** Check if callee is a child_process member call (e.g. child_process.exec). */
function isChildProcessCall(callee: TSESTree.CallExpression["callee"]): boolean {
	return callee.type === "MemberExpression" && callee.object.type === "Identifier" && callee.object.name === "child_process";
}

/** Check if callee is an fs/fsPromises member call. */
function isFsCall(callee: TSESTree.CallExpression["callee"]): boolean {
	return (
		callee.type === "MemberExpression" && callee.object.type === "Identifier" && (callee.object.name === "fs" || callee.object.name === "fsPromises")
	);
}

function detectPattern(node: TSESTree.CallExpression): MessageId | undefined {
	const info = getCalledName(node.callee);

	if (!info) {
		return undefined;
	}

	const { name, isMember } = info;

	// PnpmTask: execa("pnpm", ...) — check first (more specific)
	if (name === "execa" && !isMember && hasPnpmFirstArg(node)) {
		return "preferPnpm";
	}

	// CopyTask: fs.cp, fs.copyFile, fsPromises.cp, fsPromises.copyFile
	if (isMember && isFsCall(node.callee) && COPY_APIS.has(name)) {
		return "preferCopy";
	}

	// DeleteTask: rimraf (direct), fs.rm, fs.rmdir, fs.unlink, fsPromises.*
	if (!isMember && name === "rimraf") {
		return "preferDelete";
	}

	if (isMember && isFsCall(node.callee) && DELETE_APIS.has(name)) {
		return "preferDelete";
	}

	// ExecTask: execa, exec, execFile, spawn (direct calls)
	if (!isMember && EXEC_APIS.has(name)) {
		return "preferExec";
	}

	// ExecTask: child_process.exec, child_process.spawn, child_process.execFile
	if (isMember && isChildProcessCall(node.callee) && EXEC_APIS.has(name)) {
		return "preferExec";
	}

	return undefined;
}

export default createRule({
	defaultOptions: [],
	name: "prefer-builtin-task",
	create(context) {
		return {
			CallExpression(node) {
				const messageId = detectPattern(node);

				if (!messageId) {
					return;
				}

				if (!isInTaskAction(node)) {
					return;
				}

				const name = getDisplayName(node.callee);
				context.report({ node, messageId, data: { name } });
			}
		};
	},
	meta: {
		schema: [],
		type: "suggestion",
		docs: {
			description: "Suggest built-in task types when applicable"
		},
		messages: {
			preferPnpm: "Consider using PnpmTask instead of calling pnpm via '{{name}}'.",
			preferCopy: "Consider using CopyTask instead of '{{name}}' for file copying.",
			preferDelete: "Consider using DeleteTask instead of '{{name}}' for file deletion.",
			preferExec: "Consider using ExecTask instead of '{{name}}' for better nadle integration."
		}
	}
});
