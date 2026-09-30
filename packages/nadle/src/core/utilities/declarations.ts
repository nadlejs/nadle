import { MaybeArray } from "./maybe-array.js";
import type { Declaration } from "../models/cache/declaration.js";
import { type TaskConfiguration } from "../interfaces/task-configuration.js";

/**
 * Flatten a task's declared inputs/outputs into stable `<type>: <pattern>` strings,
 * one per declared pattern. Used for machine-readable command output.
 */
export function formatDeclarations(declarations: MaybeArray<Declaration> | undefined): string[] {
	if (declarations === undefined) {
		return [];
	}

	return MaybeArray.toArray(declarations).flatMap((declaration) => declaration.patterns.map((pattern) => `${declaration.type}: ${pattern}`));
}

/** Collect a task's declared dependencies as a list of task references. */
export function collectDependsOn(dependsOn: TaskConfiguration["dependsOn"]): string[] {
	if (dependsOn === undefined) {
		return [];
	}

	return MaybeArray.toArray(dependsOn);
}
