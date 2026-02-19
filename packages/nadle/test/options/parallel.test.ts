import { it, expect, describe } from "vitest";
import { fixture, getStdout, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("parallel")
	.configRaw(await readConfig("basic.ts"))
	.build();

describe.concurrent("--parallel", () => {
	it("should done in order 1", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				await expect(getStdout(exec`slow fast --parallel --max-workers 2`)).resolves.toDoneInOrder("fast", "slow");
			}
		}));

	it("should done in order 2", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				await expect(getStdout(exec`fast slow --parallel --max-workers 2`)).resolves.toDoneInOrder("fast", "slow");
			}
		}));
});
