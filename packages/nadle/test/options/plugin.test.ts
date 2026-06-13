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
				const lines = log.trim().split("\n");
				expect(lines[0]).toBe("beforeAll");
				expect(lines.at(-1)).toBe("afterAll");
			}
		}));

	it("fires beforeTask and afterTask around an executed task", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ cwd, exec }) => {
				await settle(exec`hello`);

				const log = await Fs.readFile(Path.join(cwd, "hooks.log"), "utf8");
				expect(log).toContain("beforeTask:hello");
				expect(log).toContain("afterTask:hello:done");
			}
		}));
});
