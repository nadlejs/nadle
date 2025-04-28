import path from "node:path";

import { execa } from "execa";
import { it, expect, describe } from "vitest";

const cliPath = path.resolve(import.meta.dirname, "../bin/nadle");
const fixturesDir = path.resolve(import.meta.dirname, "./fixtures");

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

	it("can run two commands", async () => {
		const { stdout, exitCode } = await exec`${cliPath} hello goodbye`;
		expect(exitCode).toBe(0);
		expect(stdout).toMatchSnapshot();
	});
});
