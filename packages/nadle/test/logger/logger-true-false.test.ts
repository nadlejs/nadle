import { createExec } from "setup";
import { vi, it, expect } from "vitest";

vi.mock("std-env", async () => {
	const actual = await vi.importActual("std-env");

	return { ...actual, isCI: true, isTest: false };
});

it(`use CIReporter when CI=true and TEST=false`, async () => {
	const { stdout } = await createExec()`--log-level info`;

	expect(stdout).contain(`reporters: [ CIReporter {} ] }`);
});

it("should not prepend log level in CI", async () => {
	const { stdout } = await createExec()`--log-level info`;

	expect(stdout).not.contain("[log]");
	expect(stdout).not.contain("[info]");
});
