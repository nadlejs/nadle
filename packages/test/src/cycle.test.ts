import { it, describe } from "vitest";

import { createExec, expectFail } from "./utils.js";

describe("detect cycle", () => {
	const exec = createExec({ config: "cycle" });

	it("should detect cycle from a task outside the cycle", async () => {
		await expectFail(() => exec`cycle-1`);
	});

	it("should detect cycle from a task inside the cycle", async () => {
		await expectFail(() => exec`cycle-2`);
	});

	it("should print the cycle from the first reach task", async () => {
		await expectFail(() => exec`cycle-4`);
	});

	it("should detect 2-tasks-cycle", async () => {
		await expectFail(() => exec`cycle-6`);
		await expectFail(() => exec`cycle-7`);
	});
	it("should detect 1-task-cycle", async () => {
		await expectFail(() => exec`cycle-8`);
	});
});
