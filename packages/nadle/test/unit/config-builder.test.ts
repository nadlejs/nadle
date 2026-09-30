import { raw, config } from "setup";
import { it, expect, describe } from "vitest";

describe("ConfigBuilder raw expressions", () => {
	it("emits a raw config value verbatim instead of JSON-serializing it", () => {
		const output = config()
			.taskWithConfig("build", { onlyIf: raw("() => false") }, "() => {}")
			.toString();

		expect(output).toContain('tasks.register("build", { run: () => {}, "onlyIf": () => false })');
	});

	it("still JSON-serializes plain values alongside a raw one", () => {
		const output = config()
			.taskWithConfig("build", { timeout: 50, onlyIf: raw("() => true") }, "() => {}")
			.toString();

		expect(output).toContain('"timeout": 50');
		expect(output).toContain('"onlyIf": () => true');
	});
});
