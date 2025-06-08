import { NewExec } from "setup";
import { it, describe } from "vitest";

describe("--log-level", () => {
	it("shows info log when passing --log-level=info", async () => {
		await NewExec.expectPass(NewExec.exec`hello --log-level=info`);
	});

	it("shows debug log when passing --log-level=debug", async () => {
		await NewExec.expectPass(NewExec.exec`hello --log-level=debug`);
	});

	it("shows error log only when passing --log-level=error", async () => {
		await NewExec.expectPass(NewExec.exec`hello --log-level=error`);
	});
});
