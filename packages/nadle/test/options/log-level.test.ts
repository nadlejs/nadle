import { exec, getStdout } from "setup";
import { it, expect, describe } from "vitest";

describe("--log-level", () => {
	it("shows the welcome banner and resolved options at info level", async () => {
		const stdout = await getStdout(exec`hello --log-level=info`);

		expect(stdout).toContain("Welcome to Nadle");
		expect(stdout).toContain('"logLevel": "info"');
	});

	it("still shows the welcome banner at debug level", async () => {
		const stdout = await getStdout(exec`hello --log-level=debug`);

		expect(stdout).toContain("Welcome to Nadle");
		expect(stdout).toContain('"logLevel": "debug"');
	});

	it("suppresses informational output when passing --log-level=error", async () => {
		const stdout = await getStdout(exec`hello --log-level=error`);

		// error level drops the banner, the "Using Nadle from" line, and the options dump.
		expect(stdout).not.toContain("Welcome to Nadle");
		expect(stdout).not.toContain("Using Nadle from");
		expect(stdout).not.toContain('"logLevel"');
	});
});
