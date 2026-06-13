import { exec, getStdout } from "setup";
import { it, expect, describe } from "vitest";

describe("when not given any tasks", () => {
	it("reports that no tasks were specified in a non-interactive context", async () => {
		const stdout = await getStdout(exec``);

		expect(stdout).toContain("No tasks were specified");
		expect(stdout).toContain("RUN SUCCESSFUL");
	});
});
