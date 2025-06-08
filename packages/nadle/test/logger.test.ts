import { createExec } from "setup";
import { vi, it, expect, describe, beforeAll } from "vitest";

describe("Logger", () => {
	// const environments = [
	// 	// { CI: "true", TEST: "true", reporter: "BasicReporter" },
	// 	// { CI: "true", TEST: "false", reporter: "CIReporter" },
	// 	// { CI: "false", TEST: "true", reporter: "BasicReporter" },
	// 	{ CI: "false", TEST: "false", reporter: "FancyReporter" }
	// ] as const;

	describe(`when CI=$CI and TEST=$TEST`, async () => {
		beforeAll(() => {
			vi.mock("std-env", async () => {
				const actual = await vi.importActual("std-env");

				return {
					...actual,
					isCI: false,
					isTest: false
				};
			});
		});
		it(`should use FancyReporter reporter`, async () => {
			const { stdout } = await createExec()`hello --log-level info`;

			expect(stdout).contain(`reporters: [ FancyReporter {} ] }`);
		});
	});

	it("should not prepend log level in CI", async () => {
		const { stdout } = await createExec({ env: { CI: "true", TEST: "false" } })`hello --log-level info`;

		expect(stdout).not.contain("[log]");
		expect(stdout).not.contain("[info]");
	});
});
