import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { getStdout, createExec, withFixture } from "setup";

describe.skipIf(isWindows).concurrent("task options in cache key", () => {
	it("should be up-to-date when options do not change", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-options",
			testFn: async ({ cwd }) => {
				const exec = createExec({ cwd, env: { BUILD_MODE: "production" } });

				await exec`compile`;

				await expect(getStdout(exec`compile`)).resolves.toSettle("compile", "up-to-date");
			}
		}));

	it("should miss cache when options change", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-options",
			testFn: async ({ cwd }) => {
				const execProd = createExec({ cwd, env: { BUILD_MODE: "production" } });
				const execDev = createExec({ cwd, env: { BUILD_MODE: "development" } });

				await execProd`compile`;

				await expect(getStdout(execDev`compile`)).resolves.toSettle("compile", "done");
			}
		}));

	it("should restore from cache when options revert to previous value", { timeout: 60_000 }, () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-options",
			testFn: async ({ cwd }) => {
				const execProd = createExec({ cwd, env: { BUILD_MODE: "production" } });
				const execDev = createExec({ cwd, env: { BUILD_MODE: "development" } });

				await execProd`compile`;
				await execDev`compile`;

				await expect(getStdout(execProd`compile`)).resolves.toSettle("compile", "from-cache");
			}
		})
	);
});
