import { it, expect, describe } from "vitest";
import { config, fixture, getStderr, getStdout, createExec, withGeneratedFixture } from "setup";

function buildFixture(options?: Record<string, unknown>) {
	return fixture()
		.packageJson("workers")
		.config(options ? config().configure(options) : config())
		.build();
}

const baseExecOptions = { autoInjectMaxWorkers: false, env: { NADLE_MAX_WORKERS: "64" } };

describe.concurrent("--max-workers", () => {
	describe("when not specified", () => {
		it("should set to availableParallelism - 1", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--show-config`)).resolves.contain(`"maxWorkers": 63`);
				}
			}));
	});

	describe("when specified as a number in config file", () => {
		it("should set to the specified number", () =>
			withGeneratedFixture({
				files: buildFixture({ maxWorkers: 7 }),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--show-config`)).resolves.contain(`"maxWorkers": 7`);
				}
			}));
	});

	describe("when specified as a percentage in config file", () => {
		it("should set by multiplying availableParallelism and that percentage", () =>
			withGeneratedFixture({
				files: buildFixture({ maxWorkers: "25%" }),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--show-config`)).resolves.contain(`"maxWorkers": 16`);
				}
			}));
	});

	describe("when mixed with minWorkers in config file", () => {
		it("should set both correctly", () =>
			withGeneratedFixture({
				files: buildFixture({ maxWorkers: 32, minWorkers: "20%" }),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--show-config`)).resolves.contain(`"maxWorkers": 32`);
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--show-config`)).resolves.contain(`"minWorkers": 13`);
				}
			}));
	});

	describe("when specified as a number in CLI", () => {
		it("should set to the specified number", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--max-workers 17 --show-config`)).resolves.contain(`"maxWorkers": 17`);
				}
			}));
	});

	describe("when specified as a percentage in CLI", () => {
		it("should set by multiplying availableParallelism and that percentage", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--max-workers 35% --show-config`)).resolves.contain(`"maxWorkers": 22`);
				}
			}));
	});

	describe("when specified an invalid value in CLI", () => {
		it("should throw error", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStderr(createExec({ ...baseExecOptions, cwd })`--max-workers abc --show-config`)).resolves.contains(
						`Invalid value for --max-workers`
					);
				}
			}));
	});

	describe("when specified 0", () => {
		it("should set to 1", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--max-workers 0 --show-config`)).resolves.contain(`"maxWorkers": 1`);
				}
			}));
	});

	describe("when specified a value greater than availableParallelism", () => {
		it("should set to availableParallelism", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--max-workers 1000 --show-config`)).resolves.contain(`"maxWorkers": 64`);
				}
			}));
	});
});
