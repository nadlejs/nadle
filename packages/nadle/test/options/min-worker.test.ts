import Path from "node:path";

import { it, expect, describe } from "vitest";
import { getStderr, getStdout, createExec, fixturesDir } from "setup";

describe("--min-workers", () => {
	const baseConfig = { autoInjectMaxWorkers: false, env: { NADLE_MAX_WORKERS: "64" }, cwd: Path.join(fixturesDir, "workers") };

	describe("when not specified", () => {
		it("should set to availableParallelism - 1", async () => {
			await expect(getStdout(createExec({ ...baseConfig, config: "non-config" })`--show-config`)).resolves.contain(`"minWorkers": 63`);
		});
	});

	describe("when specified as a number in config file", () => {
		it("should set to the specified number", async () => {
			await expect(getStdout(createExec({ ...baseConfig, config: "min-number" })`--show-config`)).resolves.contain(`"minWorkers": 7`);
		});
	});

	describe("when specified as a percentage in config file", () => {
		it("should set minWorkers by multiplying availableParallelism and that percentage", async () => {
			await expect(getStdout(createExec({ ...baseConfig, config: "min-percentage" })`--show-config`)).resolves.contain(`"minWorkers": 16`);
		});
	});

	describe("when specified as a number in CLI", () => {
		it("should set to the specified number", async () => {
			await expect(getStdout(createExec({ ...baseConfig })`--min-workers 17 --show-config`)).resolves.contain(`"minWorkers": 17`);
		});
	});

	describe("when specified as a percentage in CLI", () => {
		it("should set by multiplying availableParallelism and that percentage", async () => {
			await expect(getStdout(createExec({ ...baseConfig })`--min-workers 35% --show-config`)).resolves.contain(`"minWorkers": 22`);
		});

		describe("when specified max workers also", () => {
			it("should cap to maxWorkers", async () => {
				await expect(getStdout(createExec({ ...baseConfig })`--min-workers 35% --max-workers 19 --show-config`)).resolves.contain(`"minWorkers": 19`);
			});
		});
	});

	describe("when specified an invalid value in CLI", () => {
		it("should throw error", async () => {
			await expect(getStderr(() => createExec({ ...baseConfig })`--min-workers abc --show-config`)).resolves.contains(
				`Invalid value for --min-workers`
			);
		});
	});

	describe("when specified 0", () => {
		it("should set to 1", async () => {
			await expect(getStdout(createExec({ ...baseConfig, config: "non-config" })`--min-workers 0 --show-config`)).resolves.contain(`"minWorkers": 1`);
		});
	});

	describe("when specified a value greater than availableParallelism", () => {
		it("should set to availableParallelism - 1", async () => {
			await expect(getStdout(createExec({ ...baseConfig })`--min-workers 1000 --show-config`)).resolves.contain(`"minWorkers": 63`);
		});
	});
});
