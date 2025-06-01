import { it, describe } from "vitest";

import { expectPass, createExec } from "../setup/utils.js";

describe("workingDir", () => {
	const exec = createExec({ config: "working-dir" });

	it.each(["current", "oneLevelDown", "twoLevelsDown", "oneLevelUp", "twoLevelsUp"])(
		"should print correct working directory for task %s",
		async (task) => {
			await expectPass(exec`${task}`);
		}
	);
});
