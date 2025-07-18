import { it, describe } from "vitest";
import { exec, expectFail } from "setup";

describe("--stacktrace", () => {
	it("should show stack trace", async () => {
		await expectFail(exec`throwable --stacktrace`);
	});
});
