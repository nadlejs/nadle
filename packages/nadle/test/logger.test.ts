import { createExec } from "setup";
import { it, expect, describe } from "vitest";

describe("Logger", () => {
	const environments = [
		{ CI: "true", TEST: "true", reporter: "BasicReporter" },
		{ CI: "true", TEST: "false", reporter: "CIReporter" },
		{ CI: "false", TEST: "true", reporter: "BasicReporter" },
		{ CI: "false", TEST: "false", reporter: "FancyReporter" }
	] as const;

	it.each(environments)(`should use $reporter when CI=$CI and TEST=$TEST`, async ({ CI, TEST, reporter }) => {
		const { stdout } = await createExec({ env: { CI, TEST } })`hello --log-level info`;

		expect(stdout).contain(`reporters: [ ${reporter} {} ] }`);
	});

	it("should not prepend log level in CI", async () => {
		const { stdout } = await createExec({ env: { CI: "true", TEST: "false" } })`hello --log-level info`;

		expect(stdout).not.contain("[log]");
		expect(stdout).not.contain("[info]");
	});
});
