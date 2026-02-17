import ts from "typescript";
import type { Range } from "vscode-languageserver";

export interface DependencyRef {
	readonly name: string;
	readonly range: Range;
	readonly isWorkspaceQualified: boolean;
}

export interface TaskConfigInfo {
	readonly dependsOn: DependencyRef[];
	readonly description: string | null;
	readonly group: string | null;
	readonly hasInputs: boolean;
	readonly hasOutputs: boolean;
	readonly configRange: Range;
}

export interface TaskRegistration {
	readonly name: string | null;
	readonly nameRange: Range;
	readonly registrationRange: Range;
	readonly form: "function" | "no-op" | "typed";
	readonly taskObjectName: string | null;
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
		start: { line: start.line, character: start.character },
		end: { line: end.line, character: end.character }
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
			isWorkspaceQualified: node.text.includes(":")
		});
	} else if (ts.isArrayLiteralExpression(node)) {
		for (const element of node.elements) {
			if (ts.isStringLiteral(element)) {
				refs.push({
					name: element.text,
					range: toRange(element, file),
					isWorkspaceQualified: element.text.includes(":")
				});
			}
		}
	}
	return refs;
}

function extractConfig(configCall: ts.CallExpression, file: ts.SourceFile): TaskConfigInfo | null {
	const arg = configCall.arguments[0];
	if (!arg || !ts.isObjectLiteralExpression(arg)) return null;

	let dependsOn: DependencyRef[] = [];
	let description: string | null = null;
	let group: string | null = null;
	let hasInputs = false;
	let hasOutputs = false;

	for (const prop of arg.properties) {
		if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
		switch (prop.name.text) {
			case "dependsOn":
				dependsOn = extractDependsOn(prop.initializer, file);
				break;
			case "description":
				if (ts.isStringLiteral(prop.initializer)) description = prop.initializer.text;
				break;
			case "group":
				if (ts.isStringLiteral(prop.initializer)) group = prop.initializer.text;
				break;
			case "inputs":
				hasInputs = true;
				break;
			case "outputs":
				hasOutputs = true;
				break;
		}
	}

	return { dependsOn, description, group, hasInputs, hasOutputs, configRange: toRange(arg, file) };
}

function determineForm(args: ts.NodeArray<ts.Expression>): {
	form: TaskRegistration["form"];
	taskObjectName: string | null;
} {
	if (args.length >= 3) {
		const taskArg = args[1];
		return {
			form: "typed",
			taskObjectName: ts.isIdentifier(taskArg) ? taskArg.text : null
		};
	}
	return { form: args.length === 2 ? "function" : "no-op", taskObjectName: null };
}

function extractRegistration(registerCall: ts.CallExpression, configCall: ts.CallExpression | null, file: ts.SourceFile): TaskRegistration {
	const nameArg = registerCall.arguments[0];
	const name = nameArg && ts.isStringLiteral(nameArg) ? nameArg.text : null;
	const nameRange = nameArg ? toRange(nameArg, file) : toRange(registerCall, file);
	const { form, taskObjectName } = determineForm(registerCall.arguments);
	const configuration = configCall ? extractConfig(configCall, file) : null;

	return {
		name,
		nameRange,
		registrationRange: toRange(registerCall, file),
		form,
		taskObjectName,
		configuration
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

	return { uri: "", version: 0, registrations, taskNames };
}
