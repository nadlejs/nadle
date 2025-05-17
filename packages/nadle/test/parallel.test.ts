import { it, expect, describe } from "vitest";

import { createExec, expectFail, blurSnapshot, DurationBlurOptions } from "./utils.js";

describe("Parallel", () => {
	const exec = createExec({ config: "parallel" });

	it("should run tasks parallely", async () => {
		const { stdout, exitCode } = await exec`$0 --max-workers 2 task-A`;
		expect(exitCode).toBe(0);
		expect(blurSnapshot(stdout, [DurationBlurOptions, { pattern: /task-A\.[01]/g, replacement: () => "task-A.[01]" }])).toMatchSnapshot();
	}, 6000);

	it("should stop on error immediately", async () => {
		await expectFail(() => exec`$0 --max-workers 2 X`, [DurationBlurOptions, { pattern: /task-A\.[12]/g, replacement: () => "task-A.[12]" }]);
	}, 4000);
});
