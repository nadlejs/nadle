import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { getStdout, createExec, withFixture } from "setup";

describe.concurrent.skipIf(isWindows)("caching-env", () => {
	it("should be up-to-date when env does not change", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-env",
			testFn: async ({ cwd }) => {
				const exec = createExec({ cwd, env: { BUILD_MODE: "production" } });

				await exec`bundle-resources`;

				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "up-to-date");
			}
		}));

	it("should miss cache when env changes", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-env",
			testFn: async ({ cwd }) => {
				const execProd = createExec({ cwd, env: { BUILD_MODE: "production" } });
				const execDev = createExec({ cwd, env: { BUILD_MODE: "development" } });

				await execProd`bundle-resources`;

				await expect(getStdout(execDev`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
			}
		}));
});
