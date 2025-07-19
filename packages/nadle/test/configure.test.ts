import { it, describe } from "vitest";
import { createExec, expectPass } from "setup";

describe("configure", () => {
	const exec = createExec({ config: "configure" });

	it("can use configured options from config file", async () => {
		await expectPass(exec`--show-config --config-key logLevel`);
	});

	it("can override configured options from config file if the cli one is provided", async () => {
		await expectPass(exec`--log-level info --show-config --config-key logLevel`);
	});
});
