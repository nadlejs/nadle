import Url from "node:url";
import Fs from "node:fs/promises";

import fg from "fast-glob";
import { Node, Project, SyntaxKind, type CallExpression, type ObjectLiteralExpression } from "ts-morph";

/** A manual-review site logged when a call can't be migrated mechanically. */
interface ManualReview {
	file: string;
	line: number;
	reason: string;
}

const NADLE_IMPORT = "nadle";

/** Strip the surrounding braces of an object literal, returning its inner property text. */
function objectInner(object: ObjectLiteralExpression): string {
	const text = object.getText().trim();
	const inner = text.slice(1, -1).trim();

	return inner;
}

/** Detect whether a register call has already been migrated to the keyed-spec form. */
function isAlreadyKeyed(args: ReadonlyArray<Node>): boolean {
	if (args.length !== 2) {
		return false;
	}

	const second = args[1];

	return Node.isObjectLiteralExpression(second) || (Node.isCallExpression(second) && second.getExpression().getText() === "lazy");
}

/** Build the merged keyed-spec object text from the register arguments (excluding the name). */
function buildSpecParts(rest: ReadonlyArray<Node>): string[] {
	const [run, options] = rest;
	const parts: string[] = [];

	if (run !== undefined && !Node.isObjectLiteralExpression(run)) {
		parts.push(`run: ${run.getText()}`);
	}

	if (options !== undefined && Node.isObjectLiteralExpression(options)) {
		const inner = objectInner(options);

		if (inner.length > 0) {
			parts.push(`options: { ${inner} }`);
		} else {
			parts.push(`options: {}`);
		}
	}

	return parts;
}

/** Extract the object literal a `.config(() => ({ ... }))` callback returns, if simple. */
function getCallbackObject(arg: Node): ObjectLiteralExpression | null {
	if (!Node.isArrowFunction(arg) && !Node.isFunctionExpression(arg)) {
		return null;
	}

	const body = arg.getBody();

	if (Node.isObjectLiteralExpression(body)) {
		return body;
	}

	if (Node.isParenthesizedExpression(body)) {
		const inner = body.getExpression();

		if (Node.isObjectLiteralExpression(inner)) {
			return inner;
		}
	}

	return null;
}

/** Produce the replacement source for a `.config(callback)` form, wrapped in `lazy()`. */
function buildLazyReplacement(name: string, specParts: string[], callbackObject: ObjectLiteralExpression): string {
	const configInner = objectInner(callbackObject);
	const merged = [...specParts, configInner].filter((part) => part.length > 0).join(", ");

	return `tasks.register(${name}, lazy(() => ({ ${merged} })))`;
}

/** Produce the replacement source for a plain (eager) keyed-spec form. */
function buildEagerReplacement(name: string, specParts: string[], configObject: ObjectLiteralExpression | null): string {
	const parts = [...specParts];

	if (configObject !== null) {
		const inner = objectInner(configObject);

		if (inner.length > 0) {
			parts.push(inner);
		}
	}

	return `tasks.register(${name}, { ${parts.join(", ")} })`;
}

/** Return the `.config(...)` call wrapping a register call, if present. */
function findConfigCall(registerCall: CallExpression): CallExpression | null {
	const parent = registerCall.getParent();

	if (parent !== undefined && Node.isPropertyAccessExpression(parent) && parent.getName() === "config") {
		const grandParent = parent.getParent();

		if (grandParent !== undefined && Node.isCallExpression(grandParent)) {
			return grandParent;
		}
	}

	return null;
}

/** True when the call expression is `tasks.register(...)` (not `.config`, not nested). */
function isRegisterCall(call: CallExpression): boolean {
	const expression = call.getExpression();

	return Node.isPropertyAccessExpression(expression) && expression.getName() === "register" && expression.getExpression().getText() === "tasks";
}

/**
 * Migrate a single `tasks.register(...)` chain. Mutates the source via ts-morph.
 * Returns "lazy" if a lazy() wrapper was emitted, "changed" if rewritten eagerly,
 * "skip" if left unchanged, or a ManualReview reason string for complex sites.
 */
function migrateCall(registerCall: CallExpression): "lazy" | "changed" | "skip" | { manual: string } {
	const args = registerCall.getArguments();

	if (args.length === 0) {
		return "skip";
	}

	// Tuple spread — register(...x) — can't merge mechanically.
	if (args.some((arg) => Node.isSpreadElement(arg))) {
		const configCall = findConfigCall(registerCall);

		return configCall === null ? "skip" : { manual: "tuple-spread register with .config()" };
	}

	if (isAlreadyKeyed(args)) {
		return "skip";
	}

	const [name, ...rest] = args;
	const nameText = name.getText();
	const specParts = buildSpecParts(rest);
	const configCall = findConfigCall(registerCall);

	// No .config() and a single body arg (name-only or register(name, fn)) → shorthand, leave as-is.
	if (configCall === null && rest.length < 2) {
		return "skip";
	}

	// register(name, Task, opts) with no .config() → eager keyed spec.
	if (configCall === null) {
		registerCall.replaceWithText(buildEagerReplacement(nameText, specParts, null));

		return "changed";
	}

	const configArgs = configCall.getArguments();

	if (configArgs.length !== 1) {
		return { manual: "unexpected .config() arity" };
	}

	const configArg = configArgs[0];

	if (Node.isObjectLiteralExpression(configArg)) {
		configCall.replaceWithText(buildEagerReplacement(nameText, specParts, configArg));

		return "changed";
	}

	// .config(callback) — only simple `() => ({ ... })` callbacks merge mechanically.
	const callbackObject = getCallbackObject(configArg);

	if (callbackObject === null) {
		return { manual: "complex lazy config" };
	}

	configCall.replaceWithText(buildLazyReplacement(nameText, specParts, callbackObject));

	return "lazy";
}

/** Ensure a named import (e.g. `lazy`) from nadle exists, adding it if absent. */
function ensureLazyImport(project: Project, filePath: string): void {
	const sourceFile = project.getSourceFileOrThrow(filePath);
	const nadleImport = sourceFile.getImportDeclaration((decl) => decl.getModuleSpecifierValue() === NADLE_IMPORT);

	if (nadleImport === undefined) {
		sourceFile.addImportDeclaration({ namedImports: ["lazy"], moduleSpecifier: NADLE_IMPORT });

		return;
	}

	const hasLazy = nadleImport.getNamedImports().some((named) => named.getName() === "lazy");

	if (!hasLazy) {
		nadleImport.addNamedImport("lazy");
	}
}

/** Migrate a source string from the old register API to the new keyed-spec API. */
export function migrateSource(source: string, fileName = "source.ts"): string {
	const result = migrateWithReviews(source, fileName);

	return result.source;
}

/** Migrate a source string, returning the rewritten source and any manual-review sites. */
function migrateWithReviews(source: string, fileName = "source.ts"): { source: string; reviews: ManualReview[] } {
	const project = new Project({ useInMemoryFileSystem: true });
	const sourceFile = project.createSourceFile(fileName, source, { overwrite: true });
	const reviews: ManualReview[] = [];
	let needsLazyImport = false;

	// Collect first; replacing in place invalidates forward node references.
	const registerCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter(isRegisterCall);

	for (const call of registerCalls) {
		if (call.wasForgotten()) {
			continue;
		}

		const outcome = migrateCall(call);

		if (typeof outcome === "object") {
			reviews.push({ file: fileName, reason: outcome.manual, line: call.getStartLineNumber() });
		} else if (outcome === "lazy") {
			needsLazyImport = true;
		}
	}

	if (needsLazyImport) {
		ensureLazyImport(project, fileName);
	}

	return { reviews, source: sourceFile.getFullText() };
}

/** CLI entry: glob files from argv, rewrite in place, print a summary. */
async function runCli(globs: string[]): Promise<void> {
	const changed: string[] = [];
	const allReviews: ManualReview[] = [];
	const matches = await fg(globs, { absolute: true, cwd: process.cwd() });

	for (const file of matches) {
		const original = await Fs.readFile(file, "utf8");
		const { reviews, source: migrated } = migrateWithReviews(original, file);

		allReviews.push(...reviews);

		if (migrated !== original) {
			await Fs.writeFile(file, migrated);
			changed.push(file);
		}
	}

	// eslint-disable-next-line no-console -- CLI summary output is the point of this entry.
	console.log(`Migrated ${changed.length} file(s):`);

	for (const file of changed) {
		// eslint-disable-next-line no-console -- CLI summary output.
		console.log(`  ${file}`);
	}

	if (allReviews.length > 0) {
		// eslint-disable-next-line no-console -- CLI summary output.
		console.log(`\nManual review required (${allReviews.length}):`);

		for (const review of allReviews) {
			// eslint-disable-next-line no-console -- CLI summary output.
			console.log(`  ${review.file}:${review.line} — manual review: ${review.reason}`);
		}
	}
}

const invokedDirectly = process.argv[1] !== undefined && import.meta.url === Url.pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
	await runCli(process.argv.slice(2));
}
