import { execa } from "execa";
import { it, expect, describe } from "vitest";

import { cliPath, fixturesDir } from "./utils.js";

describe("CLI", () => {
	const exec = execa({ cwd: fixturesDir });

	it("prints help", async () => {
		const { stdout } = await exec`${cliPath} --help`;
		expect(stdout).toMatchSnapshot();
	});

	it("can run a simple command", async () => {
		const { stdout, exitCode } = await exec`${cliPath} hello`;
		expect(exitCode).toBe(0);
		expect(stdout).toMatchSnapshot();
	});

	it("can run two commands sequentially", async () => {
		const { stdout, exitCode } = await exec`${cliPath} hello goodbye`;
		expect(exitCode).toBe(0);
		expect(stdout).toMatchSnapshot();
	});

	it("throw error on unknown task", async () => {
		try {
			await exec`${cliPath} unknown`;
		} catch (error) {
			expect(error.exitCode).toBe(1);
			expect(error.stderr).toContain(`Error: Task "unknown" not found`);
		}
	});

	it("can run dependent task first", async () => {
		const { stdout, exitCode } = await exec`${cliPath} copy`;
		expect(exitCode).toBe(0);
		expect(stdout).toMatchSnapshot();
	});
});
