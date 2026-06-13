import Path from "node:path";
import Fs from "node:fs/promises";

import { it, expect, describe } from "vitest";
import { settle, fixture, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("plugin-basic")
	.configRaw(await readConfig("plugin-basic.ts"))
	.build();

describe("plugins", () => {
	it("fires beforeAll and afterAll around a run", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ cwd, exec }) => {
				const result = await settle(exec`hello`);
				expect(result.exitCode).toBe(0);

				const log = await Fs.readFile(Path.join(cwd, "hooks.log"), "utf8");
				expect(log).toBe("beforeAll\nafterAll\n");
			}
		}));
});
