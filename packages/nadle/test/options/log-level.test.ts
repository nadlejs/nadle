import { test, expect } from "vitest";

import { exec } from "../utils.js";

test("shows info log when passing --log-level=info", async () => {
	const { stdout, exitCode } = await exec`$0 hello --log-level=info`;
	expect(exitCode).toBe(0);
	expect(stdout).toMatchSnapshot();
});

test("shows debug log when passing --log-level=debug", async () => {
	const { stdout, exitCode } = await exec`$0 hello --log-level=debug`;
	expect(exitCode).toBe(0);
	expect(stdout).toMatchSnapshot();
});

test("shows error log only when passing --log-level=error", async () => {
	const { stdout, exitCode } = await exec`$0 hello --log-level=error`;
	expect(exitCode).toBe(0);
	expect(stdout).toMatchSnapshot();
});
