import { it, expect, describe } from "vitest";
import { config, settle, fixture, withGeneratedFixture } from "setup";

describe.concurrent("config option validation", () => {
	it("fails with a ConfigurationError when configure receives an invalid option", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("config-validation")
				.config(config().configure({ logLevel: "verbose" }).task("build"))
				.build(),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`build`);
				const output = stdout + stderr;

				// ConfigurationError exits with code 2.
				expect(exitCode).toBe(2);
				expect(output).toContain("Invalid value for");
				expect(output).toContain("logLevel");
			}
		}));

	it("runs normally when configure receives valid options", () =>
		withGeneratedFixture({
			testFn: async ({ exec }) => {
				const { exitCode } = await settle(exec`build`);

				expect(exitCode).toBe(0);
			},
			files: fixture()
				.packageJson("config-validation")
				.config(config().configure({ logLevel: "info", maxCacheEntries: 3 }).task("build"))
				.build()
		}));
});
