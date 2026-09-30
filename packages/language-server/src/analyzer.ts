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

function isFunctionLike(node: ts.Expression): boolean {
	return ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}

const CONFIG_KEYS = new Set(["dependsOn", "description", "group", "inputs", "outputs"]);

function extractConfig(spec: ts.ObjectLiteralExpression, file: ts.SourceFile): TaskConfigInfo | null {
	const hasConfigKey = spec.properties.some((prop) => ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && CONFIG_KEYS.has(prop.name.text));

	if (!hasConfigKey) {
		return null;
	}

	let dependsOn: DependencyRef[] = [];
	let description: string | null = null;
	let group: string | null = null;
	let hasInputs = false;
	let hasOutputs = false;

	for (const prop of spec.properties) {
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

	return { group, dependsOn, hasInputs, hasOutputs, description, configRange: toRange(spec, file) };
}

interface ParsedSpec {
	taskObjectName: string | null;
	form: TaskRegistration["form"];
	configuration: TaskConfigInfo | null;
}

/**
 * Classifies the `run` property of a keyed spec object and resolves the task
 * object name when `run` references a Task identifier.
 */
function classifyRun(spec: ts.ObjectLiteralExpression): { taskObjectName: string | null; form: TaskRegistration["form"] } {
	const runProp = spec.properties.find(
		(prop): prop is ts.PropertyAssignment => ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === "run"
	);

	if (!runProp) {
		return { form: "no-op", taskObjectName: null };
	}

	if (isFunctionLike(runProp.initializer)) {
		return { form: "function", taskObjectName: null };
	}

	return {
		form: "typed",
		taskObjectName: ts.isIdentifier(runProp.initializer) ? runProp.initializer.text : null
	};
}

/**
 * Parses the second argument of `tasks.register(name, secondArg)`.
 *
 * - absent → "no-op" placeholder.
 * - function (arrow/function expression) → "function" inline body.
 * - keyed spec object → classify by its `run` property and read config fields.
 * - anything else (e.g. `lazy(() => ({...}))`) → dynamic; name only, no config.
 */
function parseSecondArg(secondArg: ts.Expression | undefined, file: ts.SourceFile): ParsedSpec {
	if (!secondArg) {
		return { form: "no-op", configuration: null, taskObjectName: null };
	}

	if (isFunctionLike(secondArg)) {
		return { form: "function", configuration: null, taskObjectName: null };
	}

	if (ts.isObjectLiteralExpression(secondArg)) {
		const { form, taskObjectName } = classifyRun(secondArg);

		return { form, taskObjectName, configuration: extractConfig(secondArg, file) };
	}

	// Dynamic spec (e.g. lazy(...)): name is still resolvable, config is not.
	return { form: "no-op", configuration: null, taskObjectName: null };
}

function extractRegistration(registerCall: ts.CallExpression, file: ts.SourceFile): TaskRegistration {
	const nameArg = registerCall.arguments[0];
	const name = nameArg && ts.isStringLiteral(nameArg) ? nameArg.text : null;
	const nameRange = nameArg ? toRange(nameArg, file) : toRange(registerCall, file);
	const { form, configuration, taskObjectName } = parseSecondArg(registerCall.arguments[1], file);

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

	function walk(node: ts.Node): void {
		if (ts.isCallExpression(node) && isTasksRegister(node)) {
			registrations.push(extractRegistration(node, file));
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
