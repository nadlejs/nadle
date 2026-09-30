import { it, expect, describe } from "vitest";
import { fixture, getStdout, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("profile")
	.file("input.txt", "hello")
	.configRaw(await readConfig("profile-chain.ts"))
	.build();

describe("--summary profiling insights", () => {
	it("prints the critical path and cache-miss hotspots", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`bundle --summary`);

				expect(stdout).toContain("Critical path");
				// bundle depends on compile, so the chain runs compile → bundle.
				expect(stdout).toContain("compile");
				expect(stdout).toContain("bundle");

				expect(stdout).toContain("Cache-miss hotspots");
				// bundle declares no inputs/outputs → flagged as not cacheable.
				expect(stdout).toContain("declare inputs & outputs");
			}
		}));

	it("drops a cached task out of the hotspots on a second run", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				await getStdout(exec`bundle --summary`);

				// Second run: compile is restored from cache, so it is no longer an
				// executed hotspot; bundle still runs (not cacheable).
				const stdout = await getStdout(exec`bundle --summary`);

				expect(stdout).toContain("Cache-miss hotspots");
				expect(stdout).not.toMatch(/HOTSPOT|compile .*cache missed/);
			}
		}));

	it("emits plain CRITICAL and HOTSPOT lines with the agent reporter", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`bundle --summary --reporter agent`);

				expect(stdout).toContain("CRITICAL");
				expect(stdout).toContain("HOTSPOT");
			}
		}));
});
