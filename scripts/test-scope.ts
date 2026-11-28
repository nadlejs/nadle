export type TestScope = { kind: "none"; reason: string } | { kind: "narrow"; reason: string } | { reason: string; kind: "nadle-full" };

// Integration tests spawn the built CLI, so the import graph cannot link them to these sources.
const LIB_FEEDING_SOURCE = /^packages\/(nadle|kernel|project-resolver)\/src\//;

export function decideScope(changedFiles: readonly string[]): TestScope {
	const files = changedFiles.map((file) => file.replaceAll("\\", "/")).filter(Boolean);

	if (files.length === 0) {
		return { kind: "none", reason: "no changed files against the base" };
	}

	const trigger = files.find((file) => LIB_FEEDING_SOURCE.test(file));

	if (trigger) {
		return { kind: "nadle-full", reason: `${trigger} feeds the built CLI that integration tests spawn` };
	}

	return { kind: "narrow", reason: "no source that feeds the built CLI changed, following the import graph" };
}
