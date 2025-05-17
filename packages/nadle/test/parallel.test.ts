import { it, expect, describe } from "vitest";

import { createExec, expectFail } from "./utils.js";

describe("Parallel", () => {
	const exec = createExec({ config: "parallel" });

	it(
		"should run tasks parallely",
		async () => {
			const { stdout, exitCode } = await exec`$0 --max-workers 2 task-A`;
			expect(exitCode).toBe(0);
			expect(stdout).toMatchSnapshot();
		},
		{ timeout: 15000 }
	);

	it(
		"should stop on error immediately",
		async () => {
			await expectFail(() => exec`$0 --max-workers 2 X`);
		},
		{ timeout: 8000 }
	);
});
