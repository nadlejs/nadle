import { it, expect, describe } from "vitest";
import { settle, fixture, getStdout, createExec, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("exec-task")
	.configRaw(await readConfig("exec-task.ts"))
	.dir("main")
	.build();

describe.concurrent("execTask", () => {
	it.each(["pwd-1", "pwd-2", "pwd-3", "pwd-4", "pwd-5"])("can run %s command with configured workingDir", (command) =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`${command}`);

				expect(stdout).toContain("RUN SUCCESSFUL");
			}
		})
	);

	describe("color env", () => {
		const env = { NO_COLOR: undefined, FORCE_COLOR: undefined };

		it("forces color by default", () =>
			withGeneratedFixture({
				files,
				testFn: async ({ cwd }) => {
					const stdout = await getStdout(createExec({ cwd, env })`color-default`);

					expect(stdout).toContain("FORCE_COLOR=1 NO_COLOR=undefined");
				}
			}));

		it("keeps FORCE_COLOR configured in task env", () =>
			withGeneratedFixture({
				files,
				testFn: async ({ cwd }) => {
					const stdout = await getStdout(createExec({ cwd, env })`color-force-off`);

					expect(stdout).toContain("FORCE_COLOR=0 NO_COLOR=undefined");
				}
			}));

		it("does not force color when NO_COLOR is configured in task env", () =>
			withGeneratedFixture({
				files,
				testFn: async ({ cwd }) => {
					const stdout = await getStdout(createExec({ cwd, env })`color-no-color`);

					expect(stdout).toContain("FORCE_COLOR=undefined NO_COLOR=1");
				}
			}));

		it("relays colored failure output under the default reporter", () =>
			withGeneratedFixture({
				files,
				testFn: async ({ cwd }) => {
					const { stdout } = await settle(createExec({ cwd, env })`color-fail`);

					expect(stdout).toContain("\u001B[31m");
				}
			}));

		it("relays plain failure output under the agent reporter", () =>
			withGeneratedFixture({
				files,
				testFn: async ({ cwd }) => {
					const { stdout } = await settle(createExec({ cwd, env })`color-fail --reporter agent`);

					expect(stdout).toContain("plain-failure");
					expect(stdout).not.toContain("\u001B");
				}
			}));

		it("keeps color explicitly configured in task env under the agent reporter", () =>
			withGeneratedFixture({
				files,
				testFn: async ({ cwd }) => {
					const { stdout } = await settle(createExec({ cwd, env })`color-fail-forced --reporter agent`);

					expect(stdout).toContain("\u001B[31m");
				}
			}));
	});
});
