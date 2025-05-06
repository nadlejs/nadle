import { it, expect, describe } from "vitest";

import { createExec } from "./utils.js";

describe("dependsOn", () => {
	const exec = createExec({ config: "depends-on" });

	it("should run dependent tasks first", async () => {
		const { stdout } = await exec`$0 compileTs`;
		expect(stdout).toMatchSnapshot();
	});

	it("should run shared dependent tasks", async () => {
		const { stdout } = await exec`$0 compile test`;
		expect(stdout).toMatchSnapshot();
	});

	it("should run shared dependent tasks 2", async () => {
		const { stdout } = await exec`$0 test compile`;
		expect(stdout).toMatchSnapshot();
	});
});
