import { it, expect, describe } from "vitest";
import { getStdout, createExec } from "setup";

describe("--parallel", () => {
	const exec = createExec({ config: "basic" });

	it("should done in order 1", async () => {
		const stdout = await getStdout(exec`slow fast --parallel --max-workers 2`);

		expect(stdout).toDoneInOrder("fast", "slow");
	});

	it("should done in order 2", async () => {
		const stdout = await getStdout(exec`fast slow --parallel --max-workers 2`);

		expect(stdout).toDoneInOrder("fast", "slow");
	});
});
