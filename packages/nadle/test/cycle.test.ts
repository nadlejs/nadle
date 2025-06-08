import { NewExec } from "setup";
import { it, describe } from "vitest";

describe("detect cycle", () => {
	const exec = NewExec.createExec({ config: "cycle" });

	it("should detect cycle from a task outside the cycle", async () => {
		await NewExec.expectFail(() => exec`cycle-1`);
	});

	it("should detect cycle from a task inside the cycle", async () => {
		await NewExec.expectFail(() => exec`cycle-2`);
	});

	it("should print the cycle from the first reach task", async () => {
		await NewExec.expectFail(() => exec`cycle-4`);
	});

	it("should detect 2-tasks-cycle", async () => {
		await NewExec.expectFail(() => exec`cycle-6`);
		await NewExec.expectFail(() => exec`cycle-7`);
	});
	it("should detect 1-task-cycle", async () => {
		await NewExec.expectFail(() => exec`cycle-8`);
	});
});
