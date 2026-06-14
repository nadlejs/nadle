import { it, expect, describe } from "vitest";
import { settle, config, fixture, withGeneratedFixture } from "setup";

describe.concurrent("doctor", () => {
	it("reports project health and exits zero on a clean project", () =>
		withGeneratedFixture({
			files: fixture().packageJson("doctor-clean").config(config().task("build")).build(),
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`--doctor`);

				expect(exitCode).toBe(0);
				expect(stdout).toContain("Project resolved");
				expect(stdout).toContain("Doctor:");
			}
		}));

	it("warns about a task with inputs but no outputs", () =>
		withGeneratedFixture({
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`--doctor`);

				expect(exitCode).toBe(0);
				expect(stdout).toContain("never cached");
				expect(stdout).toContain("1 warning(s)");
			},
			files: fixture()
				.packageJson("doctor-partial")
				.configRaw(
					['import { tasks, Inputs } from "nadle";', "", 'tasks.register("build", () => {}).config({ inputs: [Inputs.dirs("src")] });'].join("\n")
				)
				.dir("src")
				.build()
		}));

	it("warns about a cacheable task whose outputs are missing", () =>
		withGeneratedFixture({
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`--doctor`);

				expect(exitCode).toBe(0);
				expect(stdout).toContain("no existing declared outputs");
			},
			files: fixture()
				.packageJson("doctor-stale")
				.configRaw(
					[
						'import { tasks, Inputs, Outputs } from "nadle";',
						"",
						'tasks.register("build", () => {}).config({ inputs: [Inputs.dirs("src")], outputs: [Outputs.dirs("dist")] });'
					].join("\n")
				)
				.dir("src")
				.build()
		}));
});
