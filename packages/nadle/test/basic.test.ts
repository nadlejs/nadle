import { it, expect, describe } from "vitest";

import { exec } from "./utils.js";

describe("CLI", () => {
	it("can run a simple command", async () => {
		const { stdout, exitCode } = await exec`$0 hello`;
		expect(exitCode).toBe(0);
		expect(stdout).toMatchSnapshot();
	});

	it("can run two commands sequentially", async () => {
		const { stdout, exitCode } = await exec`$0 hello goodbye`;
		expect(exitCode).toBe(0);
		expect(stdout).toMatchSnapshot();
	});



	it("can run dependent task first", async () => {
		const { stdout, exitCode } = await exec`$0 copy`;
		expect(exitCode).toBe(0);
		expect(stdout).toMatchSnapshot();
	});
});
