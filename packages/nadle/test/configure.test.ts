import { it, describe } from "vitest";

import { createExec, expectPass } from "./setup/utils.js";

describe("Configure", () => {
	const exec = createExec({ config: "configure" });

	it("can use configured options from config file", async () => {
		await expectPass(exec`--show-config`);
	});

	it("can override configured options from config file if the cli one is provided", async () => {
		await expectPass(exec`--log-level info --show-config`);
	});
});
