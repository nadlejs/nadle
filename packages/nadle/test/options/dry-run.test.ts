import { it, expect, describe } from "vitest";

import { exec, createExec } from "../utils.js";

describe("--dry-run", () => {
	it("should list for one task", async () => {
		const { stdout, exitCode } = await exec`$0 hello --dry-run`;
		expect(exitCode).toBe(0);
		expect(stdout).toMatchSnapshot();
	});

	it("should list for dependent tasks", async () => {
		const { stdout, exitCode } = await createExec({ config: "depends-on" })`$0 build --dry-run`;
		expect(exitCode).toBe(0);
		expect(stdout).toMatchSnapshot();
	});
});
