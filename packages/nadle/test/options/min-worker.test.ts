import { it, expect, describe } from "vitest";
import { config, fixture, getStderr, getStdout, createExec, withGeneratedFixture } from "setup";

function buildFixture(options?: Record<string, unknown>) {
	return fixture()
		.packageJson("workers")
		.config(options ? config().configure(options) : config())
		.build();
}

const baseExecOptions = { autoInjectMaxWorkers: false, env: { NADLE_MAX_WORKERS: "64" } };

describe.concurrent("--min-workers", () => {
	describe("when not specified", () => {
		it("should set to availableParallelism - 1", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--show-config`)).resolves.contain(`"minWorkers": 63`);
				}
			}));
	});

	describe("when specified as a number in config file", () => {
		it("should set to the specified number", () =>
			withGeneratedFixture({
				files: buildFixture({ minWorkers: 7 }),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--show-config`)).resolves.contain(`"minWorkers": 7`);
				}
			}));
	});

	describe("when specified as a percentage in config file", () => {
		it("should set minWorkers by multiplying availableParallelism and that percentage", () =>
			withGeneratedFixture({
				files: buildFixture({ minWorkers: "25%" }),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--show-config`)).resolves.contain(`"minWorkers": 16`);
				}
			}));
	});

	describe("when specified as a number in CLI", () => {
		it("should set to the specified number", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--min-workers 17 --show-config`)).resolves.contain(`"minWorkers": 17`);
				}
			}));
	});

	describe("when specified as a percentage in CLI", () => {
		it("should set by multiplying availableParallelism and that percentage", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--min-workers 35% --show-config`)).resolves.contain(`"minWorkers": 22`);
				}
			}));

		describe("when specified max workers also", () => {
			it("should cap to maxWorkers", () =>
				withGeneratedFixture({
					files: buildFixture(),
					testFn: async ({ cwd }) => {
						await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--min-workers 35% --max-workers 19 --show-config`)).resolves.contain(
							`"minWorkers": 19`
						);
					}
				}));
		});
	});

	describe("when specified an invalid value in CLI", () => {
		it("should throw error", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStderr(createExec({ ...baseExecOptions, cwd })`--min-workers abc --show-config`)).resolves.contains(
						`Invalid value for --min-workers`
					);
				}
			}));
	});

	describe("when specified 0", () => {
		it("should set to 1", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--min-workers 0 --show-config`)).resolves.contain(`"minWorkers": 1`);
				}
			}));
	});

	describe("when specified a value greater than availableParallelism", () => {
		it("should set to availableParallelism - 1", () =>
			withGeneratedFixture({
				files: buildFixture(),
				testFn: async ({ cwd }) => {
					await expect(getStdout(createExec({ ...baseExecOptions, cwd })`--min-workers 1000 --show-config`)).resolves.contain(`"minWorkers": 63`);
				}
			}));
	});
});
