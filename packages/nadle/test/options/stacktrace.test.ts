import { exec, expectFail } from "setup";
import { it, describe } from "vite-plus/test";

describe("--stacktrace", () => {
	it("should show stack trace", async () => {
		await expectFail(exec`throwable --stacktrace`);
	});
});
