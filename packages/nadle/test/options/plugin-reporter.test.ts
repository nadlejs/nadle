import { it, expect, describe } from "vitest";
import { settle, fixture, getStderr, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("plugin-reporter")
	.configRaw(await readConfig("plugin-reporter.ts"))
	.build();

describe("plugin reporter", () => {
	it("selects a plugin-contributed reporter by name", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`hello --reporter json`);
				expect(result.stdout).toContain("JSON_REPORTER_ACTIVE");
			}
		}));

	it("errors with the available reporters on an unknown name", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stderr = await getStderr(exec`hello --reporter nope`);
				expect(stderr).toContain("Unknown reporter");
				expect(stderr).toContain("json");
			}
		}));
});
