import { it, expect, describe } from "vitest";
import { config, fixture, getStderr, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("unknown-task")
	.config(config().task("bootstrap").task("buildDev").task("buildProd").task("compileTs").task("compileJs").task("compileCss"))
	.build();

describe.concurrent("when passing unknown tasks", () => {
	it("should throw error without any suggestions if not find any similar tasks", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stderr = await getStderr(exec`unknown`);

				expect(stderr).toContain("Task");
				expect(stderr).toContain("unknown");
				expect(stderr).toContain("not found");
				expect(stderr).not.toContain("Did you mean");
			}
		}));

	it("should throw error with suggestions if find similar tasks", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stderrBoot = await getStderr(exec`boot`);

				expect(stderrBoot).toContain("not found");

				const stderrBuild = await getStderr(exec`build`);

				expect(stderrBuild).toContain("Did you mean");
				expect(stderrBuild).toContain("buildDev");

				const stderrCompile = await getStderr(exec`compile`);

				expect(stderrCompile).toContain("Did you mean");
				expect(stderrCompile).toContain("compileTs");
			}
		}));
});
