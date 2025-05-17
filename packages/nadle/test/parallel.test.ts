import { it, expect, describe } from "vitest";

import { createExec, expectFail, blurSnapshot } from "./utils.js";

describe("Parallel", () => {
	const exec = createExec({ config: "parallel" });
	const blurOptions = {
		pattern: /task-A\.[01]/g,
		replacement: () => "task-A.[01]"
	};

	it("should run tasks parallely", async () => {
		const { stdout, exitCode } = await exec`$0 --max-workers 2 task-A`;
		expect(exitCode).toBe(0);
		expect(blurSnapshot(stdout, blurOptions)).toMatchSnapshot();
	}, 6000);

	it("should stop on error immediately", async () => {
		await expectFail(() => exec`$0 --max-workers 2 X`, blurOptions);
	}, 4000);
});
