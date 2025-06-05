import { it, describe } from "vitest";
import { createExec, expectPass } from "setup";

describe("workingDir", () => {
	const exec = createExec({ config: "working-dir" });

	it.each(["current", "oneLevelDown", "twoLevelsDown", "oneLevelUp", "twoLevelsUp"])(
		"should print correct working directory for task %s",
		async (task) => {
			await expectPass(exec`${task}`);
		}
	);
});
