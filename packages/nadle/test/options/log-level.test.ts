import { it, describe } from "vitest";
import { exec, expectPass } from "setup";

describe("--log-level", () => {
	it.skip("shows info log when passing --log-level=info", async () => {
		await expectPass(exec`hello --log-level=info`);
	});

	it.skip("shows debug log when passing --log-level=debug", async () => {
		await expectPass(exec`hello --log-level=debug`);
	});

	it("shows error log only when passing --log-level=error", async () => {
		await expectPass(exec`hello --log-level=error`);
	});
});
