import { NewExec } from "setup";
import { it, describe } from "vitest";

describe("Configure", () => {
	const exec = NewExec.createExec({ config: "configure" });

	it.skip("can use configured options from config file", async () => {
		await NewExec.expectPass(exec`--show-config`);
	});

	it("can override configured options from config file if the cli one is provided", async () => {
		await NewExec.expectPass(exec`--log-level info --show-config`);
	});
});
