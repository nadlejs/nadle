import { getStdout, createExec } from "setup";
import { it, expect, describe } from "vitest";

describe("env", () => {
	const exec = createExec({ config: "env" });

	it("can inject env to process.env from object config", async () => {
		const stdout = await getStdout(exec`firstTask`);

		expect(stdout).contain("first task env");
		expect(stdout).not.contain("second task env");
	});

	it("can inject env to process.env from callback config", async () => {
		const stdout = await getStdout(exec`secondTask`);

		expect(stdout).contain("second task env");
		expect(stdout).not.contain("first task env");
	});

	it("should not inject env from other task", async () => {
		const stdout = await getStdout(exec`firstTask secondTask`);

		expect(stdout.match(/first task env/g)).toHaveLength(1);
		expect(stdout.match(/second task env/g)).toHaveLength(1);
		expect(stdout.indexOf("Task firstTask done")).toBeGreaterThan(stdout.indexOf("first task env"));
		expect(stdout.indexOf("second task env")).toBeGreaterThan(stdout.indexOf("Task secondTask started"));
	});

	it("should not inject env from other task 2", async () => {
		const stdout = await getStdout(exec`firstTask secondTask`);

		expect(stdout.match(/first task env/g)).toHaveLength(1);
		expect(stdout.match(/second task env/g)).toHaveLength(1);
	});

	it("should not inject env from other task 3", async () => {
		const stdout = await getStdout(exec`firstTask secondTask --max-workers 2`);

		expect(stdout.match(/first task env/g)).toHaveLength(1);
		expect(stdout.match(/second task env/g)).toHaveLength(1);
	});
});
