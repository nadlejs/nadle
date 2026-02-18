import { it, expect, describe } from "vitest";
import { fixture, getStdout, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("env")
	.configRaw(await readConfig("env.ts"))
	.build();

describe.concurrent("env", () => {
	it("can inject env to process.env from object config", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`firstTask`);

				expect(stdout).contain("first task env");
				expect(stdout).not.contain("second task env");
			}
		}));

	it("can inject env to process.env from callback config", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`secondTask`);

				expect(stdout).contain("second task env");
				expect(stdout).not.contain("first task env");
			}
		}));

	it("should not inject env from other task", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`firstTask secondTask`);

				expect(stdout.match(/first task env/g)).toHaveLength(1);
				expect(stdout.match(/second task env/g)).toHaveLength(1);
				expect(stdout.indexOf("Task firstTask DONE")).toBeGreaterThan(stdout.indexOf("first task env"));
				expect(stdout.indexOf("second task env")).toBeGreaterThan(stdout.indexOf("Task secondTask STARTED"));
			}
		}));

	it("should not inject env from other task 2", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`firstTask secondTask`);

				expect(stdout.match(/first task env/g)).toHaveLength(1);
				expect(stdout.match(/second task env/g)).toHaveLength(1);
			}
		}));

	it("should not inject env from other task 3", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`firstTask secondTask --max-workers 2`);

				expect(stdout.match(/first task env/g)).toHaveLength(1);
				expect(stdout.match(/second task env/g)).toHaveLength(1);
			}
		}));
});
