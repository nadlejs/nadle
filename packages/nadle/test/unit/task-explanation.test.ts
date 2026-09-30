import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";

import { type TaskExplanation, renderTaskExplanation } from "../../src/core/reporting/task-explanation.js";

const base: TaskExplanation.Props = {
	inputs: [],
	pullPaths: [],
	label: "build",
	dependents: [],
	cachingEnabled: true,
	requestedDirectly: false
};

const render = (props: Partial<TaskExplanation.Props>) => stripAnsi(renderTaskExplanation({ ...base, ...props }));

describe.concurrent("renderTaskExplanation", () => {
	it("always shows the task label and the three section headers", () => {
		const out = render({});

		expect(out).toContain("Task: build");
		expect(out).toContain("Why it runs:");
		expect(out).toContain("What depends on it:");
		expect(out).toContain("Inputs:");
	});

	it("notes a directly requested task", () => {
		expect(render({ requestedDirectly: true })).toContain("Requested directly on the command line.");
	});

	it("falls back when nothing requests the task", () => {
		expect(render({})).toContain("Nothing requests this task");
	});

	it("renders pull paths with arrows", () => {
		const out = render({ pullPaths: [["build", "test", "install"]] });

		expect(out).toContain("Pulled in by:");
		expect(out).toContain("build → test → install");
	});

	it("uses 'Also pulled in by' when also requested directly", () => {
		const out = render({ requestedDirectly: true, pullPaths: [["a", "b"]] });

		expect(out).toContain("Requested directly on the command line.");
		expect(out).toContain("Also pulled in by:");
	});

	it("lists dependents or notes their absence", () => {
		expect(render({ dependents: ["check", "publish"] })).toMatch(/check[\s\S]*publish/);
		expect(render({ dependents: [] })).toContain("Nothing depends on this task.");
	});

	it("lists inputs with a caching note", () => {
		const enabled = render({ cachingEnabled: true, inputs: ["file: src/index.ts"] });
		expect(enabled).toContain("file: src/index.ts");
		expect(enabled).toContain("caching enabled");

		const disabled = render({ cachingEnabled: false, inputs: ["file: src/index.ts"] });
		expect(disabled).toContain("caching disabled");
	});

	it("notes when no inputs are declared", () => {
		expect(render({ inputs: [] })).toContain("No declared inputs");
	});
});
