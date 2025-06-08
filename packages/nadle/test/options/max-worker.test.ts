import Path from "node:path";

import { it, expect, describe } from "vitest";
import { getStderr, getStdout, createExec, fixturesDir } from "setup";

describe("--max-workers", () => {
	const baseConfig = { autoInjectMaxWorkers: false, env: { NADLE_MAX_WORKERS: "64" }, cwd: Path.join(fixturesDir, "workers") };

	describe("when not specified", () => {
		it("should set to availableParallelism - 1", async () => {
			await expect(getStdout(createExec({ ...baseConfig, config: "non-config" })`--show-config`)).resolves.contain(`"maxWorkers": 63`);
		});
	});

	describe("when specified as a number in config file", () => {
		it("should set to the specified number", async () => {
			await expect(getStdout(createExec({ ...baseConfig, config: "max-number" })`--show-config`)).resolves.contain(`"maxWorkers": 7`);
		});
	});

	describe("when specified as a percentage in config file", () => {
		it("should set by multiplying availableParallelism and that percentage", async () => {
			await expect(getStdout(createExec({ ...baseConfig, config: "max-percentage" })`--show-config`)).resolves.contain(`"maxWorkers": 16`);
		});
	});

	describe("when mixed with minWorkers in config file", () => {
		it("should set both correctly", async () => {
			await expect(getStdout(createExec({ ...baseConfig, config: "mixed" })`--show-config`)).resolves.contain(`"maxWorkers": 32`);
			await expect(getStdout(createExec({ ...baseConfig, config: "mixed" })`--show-config`)).resolves.contain(`"minWorkers": 13`);
		});
	});

	describe("when specified as a number in CLI", () => {
		it("should set to the specified number", async () => {
			await expect(getStdout(createExec({ ...baseConfig })`--max-workers 17 --show-config`)).resolves.contain(`"maxWorkers": 17`);
		});
	});

	describe("when specified as a percentage in CLI", () => {
		it("should set by multiplying availableParallelism and that percentage", async () => {
			await expect(getStdout(createExec({ ...baseConfig })`--max-workers 35% --show-config`)).resolves.contain(`"maxWorkers": 22`);
		});
	});

	describe("when specified an invalid value in CLI", () => {
		it("should throw error", async () => {
			await expect(getStderr(() => createExec({ ...baseConfig })`--max-workers abc --show-config`)).resolves.contains(
				`Invalid value for --max-workers`
			);
		});
	});

	describe("when specified 0", () => {
		it("should set to 1", async () => {
			await expect(getStdout(createExec({ ...baseConfig, config: "non-config" })`--max-workers 0 --show-config`)).resolves.contain(`"maxWorkers": 1`);
		});
	});

	describe("when specified a value greater than availableParallelism", () => {
		it("should set to availableParallelism", async () => {
			await expect(getStdout(createExec({ ...baseConfig })`--max-workers 1000 --show-config`)).resolves.contain(`"maxWorkers": 64`);
		});
	});
});
