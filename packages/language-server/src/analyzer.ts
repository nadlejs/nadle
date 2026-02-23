import ts from "typescript";
import type { Range } from "vscode-languageserver";
import { isWorkspaceQualified } from "@nadle/kernel";

export interface DependencyRef {
	readonly name: string;
	readonly range: Range;
	readonly isWorkspaceQualified: boolean;
}

export interface TaskConfigInfo {
	readonly hasInputs: boolean;
	readonly configRange: Range;
	readonly hasOutputs: boolean;
	readonly group: string | null;
	readonly dependsOn: DependencyRef[];
	readonly description: string | null;
}

export interface TaskRegistration {
	readonly nameRange: Range;
	readonly name: string | null;
	readonly registrationRange: Range;
	readonly taskObjectName: string | null;
	readonly form: "function" | "no-op" | "typed";
	readonly configuration: TaskConfigInfo | null;
}

export interface DocumentAnalysis {
	readonly uri: string;
	readonly version: number;
	readonly registrations: TaskRegistration[];
	readonly taskNames: Map<string, TaskRegistration[]>;
}

function toRange(node: ts.Node, file: ts.SourceFile): Range {
	const start = file.getLineAndCharacterOfPosition(node.getStart(file));
	const end = file.getLineAndCharacterOfPosition(node.getEnd());

	return {
		end: { line: end.line, character: end.character },
		start: { line: start.line, character: start.character }
	};
}

function isTasksRegister(node: ts.CallExpression): boolean {
	const { expression } = node;

	return (
		ts.isPropertyAccessExpression(expression) &&
		ts.isIdentifier(expression.expression) &&
		expression.expression.text === "tasks" &&
		expression.name.text === "register"
	);
}

function findConfigCall(registerCall: ts.CallExpression): ts.CallExpression | null {
	const { parent } = registerCall;

	if (!ts.isPropertyAccessExpression(parent) || parent.name.text !== "config") {
		return null;
	}

	return ts.isCallExpression(parent.parent) ? parent.parent : null;
}

function extractDependsOn(node: ts.Expression, file: ts.SourceFile): DependencyRef[] {
	const refs: DependencyRef[] = [];

	if (ts.isStringLiteral(node)) {
		refs.push({
			name: node.text,
			range: toRange(node, file),
			isWorkspaceQualified: isWorkspaceQualified(node.text)
		});
	} else if (ts.isArrayLiteralExpression(node)) {
		for (const element of node.elements) {
			if (ts.isStringLiteral(element)) {
				refs.push({
					name: element.text,
					range: toRange(element, file),
					isWorkspaceQualified: isWorkspaceQualified(element.text)
				});
			}
		}
	}

	return refs;
}

function extractConfig(configCall: ts.CallExpression, file: ts.SourceFile): TaskConfigInfo | null {
	const arg = configCall.arguments[0];

	if (!arg || !ts.isObjectLiteralExpression(arg)) {
		return null;
	}

	let dependsOn: DependencyRef[] = [];
	let description: string | null = null;
	let group: string | null = null;
	let hasInputs = false;
	let hasOutputs = false;

	for (const prop of arg.properties) {
		if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) {
			continue;
		}

		switch (prop.name.text) {
			case "dependsOn":
				dependsOn = extractDependsOn(prop.initializer, file);
				break;
			case "description":
				if (ts.isStringLiteral(prop.initializer)) {
					description = prop.initializer.text;
				}

				break;
			case "group":
				if (ts.isStringLiteral(prop.initializer)) {
					group = prop.initializer.text;
				}

				break;
			case "inputs":
				hasInputs = true;
				break;
			case "outputs":
				hasOutputs = true;
				break;
		}
	}

	return { group, dependsOn, hasInputs, hasOutputs, description, configRange: toRange(arg, file) };
}

function determineForm(args: ts.NodeArray<ts.Expression>): {
	taskObjectName: string | null;
	form: TaskRegistration["form"];
} {
	if (args.length >= 3) {
		const taskArg = args[1];

		return {
			form: "typed",
			taskObjectName: ts.isIdentifier(taskArg) ? taskArg.text : null
		};
	}

	return { taskObjectName: null, form: args.length === 2 ? "function" : "no-op" };
}

function extractRegistration(registerCall: ts.CallExpression, configCall: ts.CallExpression | null, file: ts.SourceFile): TaskRegistration {
	const nameArg = registerCall.arguments[0];
	const name = nameArg && ts.isStringLiteral(nameArg) ? nameArg.text : null;
	const nameRange = nameArg ? toRange(nameArg, file) : toRange(registerCall, file);
	const { form, taskObjectName } = determineForm(registerCall.arguments);
	const configuration = configCall ? extractConfig(configCall, file) : null;

	return {
		name,
		form,
		nameRange,
		configuration,
		taskObjectName,
		registrationRange: toRange(registerCall, file)
	};
}

export function analyzeDocument(content: string, fileName: string): DocumentAnalysis {
	const file = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
	const registrations: TaskRegistration[] = [];
	const processed = new Set<ts.CallExpression>();

	function walk(node: ts.Node): void {
		if (ts.isCallExpression(node) && isTasksRegister(node) && !processed.has(node)) {
			processed.add(node);
			registrations.push(extractRegistration(node, findConfigCall(node), file));
		}

		ts.forEachChild(node, walk);
	}

	walk(file);

	const taskNames = new Map<string, TaskRegistration[]>();

	for (const reg of registrations) {
		if (reg.name !== null) {
			const list = taskNames.get(reg.name) ?? [];
			list.push(reg);
			taskNames.set(reg.name, list);
		}
	}

	return { uri: "", taskNames, version: 0, registrations };
}
