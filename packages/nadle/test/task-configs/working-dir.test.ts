import { NewExec } from "setup";
import { it, describe } from "vitest";

describe("workingDir", () => {
	const exec = NewExec.createExec({ config: "working-dir" });

	it.each(["current", "oneLevelDown", "twoLevelsDown", "oneLevelUp", "twoLevelsUp"])(
		"should print correct working directory for task %s",
		async (task) => {
			await NewExec.expectPass(exec`${task}`);
		}
	);
});
