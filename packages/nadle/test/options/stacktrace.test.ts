import { NewExec } from "setup";
import { it, describe } from "vitest";

describe("--stacktrace", () => {
	it("should show stack trace", async () => {
		await NewExec.expectFail(() => NewExec.exec`throwable --stacktrace`);
	});
});
