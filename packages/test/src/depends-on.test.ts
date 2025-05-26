import { it, describe } from "vitest";

import { createExec, expectPass } from "./utils.js";

describe.skip("dependsOn", () => {
	const exec = createExec({ config: "depends-on" });

	it("should run dependent tasks first", async () => {
		await expectPass(exec`compileTs`);
	});

	it("should run shared dependent tasks", async () => {
		await expectPass(exec`compile test`);
	});

	it("should run shared dependent tasks 2", async () => {
		await expectPass(exec`test compile`);
	});
});
