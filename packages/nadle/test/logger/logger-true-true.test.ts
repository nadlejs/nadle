import { createExec } from "setup";
import { vi, it, expect } from "vitest";

vi.mock("std-env", async () => {
	const actual = await vi.importActual("std-env");

	return { ...actual, isCI: false, isTest: true };
});

it(`use BasicReporter when CI=false and TEST=true`, async () => {
	const { stdout } = await createExec()`--log-level info`;

	expect(stdout).contain(`reporters: [ BasicReporter {} ] }`);
});
