import Path from "node:path";

import { it, expect, describe } from "vitest";
import { exec, getStdout, withFixture } from "setup";

import { isPathExists } from "../../src/core/utilities/fs.js";

describe.concurrent("--no-cache", () => {
	it("should resolve cache = true when not specified the flags", async () => {
		expect(await getStdout(exec`--show-config`)).contain(`"cache": true`);
	});

	it("should resolve cache = false when specify --no-cache", async () => {
		expect(await getStdout(exec`--no-cache --show-config`)).contain(`"cache": false`);
	});

	it("should resolve cache = true when specify --cache", async () => {
		expect(await getStdout(exec`--cache --show-config`)).contain(`"cache": true`);
	});

	it("should create the .nadle directory by default", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "no-cache",
			testFn: async ({ cwd, exec }) => {
				await expect(getStdout(exec`bundle`)).resolves.toSettle("bundle", "done");
				await expect(getStdout(exec`bundle`)).resolves.toSettle("bundle", "up-to-date");
				await expect(isPathExists(Path.join(cwd, ".nadle"))).resolves.toBe(true);
			}
		}));

	it("should not create the .nadle directory when specifying --no-cache", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "no-cache",
			testFn: async ({ cwd, exec }) => {
				await expect(getStdout(exec`bundle --no-cache`)).resolves.toSettle("bundle", "done");
				await expect(getStdout(exec`bundle --no-cache`)).resolves.toSettle("bundle", "done");
				await expect(isPathExists(Path.join(cwd, ".nadle"))).resolves.toBe(false);
			}
		}));
});
