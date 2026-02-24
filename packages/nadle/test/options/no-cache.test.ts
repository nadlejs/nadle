import Path from "node:path";

import { it, expect, describe } from "vitest";
import { exec, fixture, getStdout, readConfig, withGeneratedFixture } from "setup";

import { isPathExists } from "../../src/core/utilities/fs.js";

const noCacheFiles = fixture()
	.packageJson("no-cache")
	.configRaw(await readConfig("no-cache.ts"))
	.file("input.txt", "input")
	.build();

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

	it("should create the node_modules/.cache/nadle directory by default", () =>
		withGeneratedFixture({
			files: noCacheFiles,
			testFn: async ({ cwd, exec }) => {
				await expect(getStdout(exec`bundle`)).resolves.toSettle("bundle", "done");
				await expect(getStdout(exec`bundle`)).resolves.toSettle("bundle", "up-to-date");
				await expect(isPathExists(Path.join(cwd, "node_modules/.cache/nadle"))).resolves.toBe(true);
			}
		}));

	it("should not create the node_modules/.cache/nadle directory when specifying --no-cache", () =>
		withGeneratedFixture({
			files: noCacheFiles,
			testFn: async ({ cwd, exec }) => {
				await expect(getStdout(exec`bundle --no-cache`)).resolves.toSettle("bundle", "done");
				await expect(getStdout(exec`bundle --no-cache`)).resolves.toSettle("bundle", "done");
				await expect(isPathExists(Path.join(cwd, "node_modules/.cache/nadle"))).resolves.toBe(false);
			}
		}));
});
