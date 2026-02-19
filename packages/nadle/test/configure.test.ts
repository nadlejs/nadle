import { it, expect, describe } from "vitest";
import { config, fixture, getStdout, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("configure")
	.config(config().configure({ logLevel: "error" }))
	.build();

describe.concurrent("configure", () => {
	it("can use configured options from config file", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`--show-config --config-key logLevel`);

				expect(stdout).not.toContain("[info]");
			}
		}));

	it("can override configured options from config file if the cli one is provided", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`--log-level info --show-config --config-key logLevel`);

				expect(stdout).toContain(`"logLevel": "info"`);
			}
		}));
});
