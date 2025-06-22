import Path from "node:path";
import Fs from "node:fs/promises";

import { exec, getStdout, createExec, fixturesDir } from "setup";
import { it, expect, describe, afterEach, beforeEach } from "vitest";

import { isPathExists } from "../../src/core/fs-utils.js";

describe("--no-cache", () => {
	it("should resolve cache = true when not specified the flags", async () => {
		expect(await getStdout(exec`--show-config`)).contain(`"cache": true`);
	});

	it("should resolve cache = false when specify --no-cache", async () => {
		expect(await getStdout(exec`--no-cache --show-config`)).contain(`"cache": false`);
	});

	it("should resolve cache = true when specify --cache", async () => {
		expect(await getStdout(exec`--cache --show-config`)).contain(`"cache": true`);
	});

	describe("given a setup workspace", () => {
		const cwd = Path.join(fixturesDir, "no-cache");

		beforeEach(async () => {
			await Fs.rm(Path.join(cwd, "dist"), { force: true, recursive: true });
			await Fs.rm(Path.join(cwd, ".nadle"), { force: true, recursive: true });
		});

		afterEach(async () => {
			await Fs.rm(Path.join(cwd, "dist"), { force: true, recursive: true });
			await Fs.rm(Path.join(cwd, ".nadle"), { force: true, recursive: true });
		});

		it("should create create the .nadle directory by default", async () => {
			const exec = createExec({ cwd });

			await expect(getStdout(exec`bundle`)).resolves.toSettle("bundle", "done");
			await expect(getStdout(exec`bundle`)).resolves.toSettle("bundle", "up-to-date");
			await expect(isPathExists(Path.join(cwd, ".nadle"))).resolves.toBe(true);
		});

		it("should not create the .nadle directory when specifying --no-cache", async () => {
			const exec = createExec({ cwd });

			await expect(getStdout(exec`bundle --no-cache`)).resolves.toSettle("bundle", "done");
			await expect(getStdout(exec`bundle --no-cache`)).resolves.toSettle("bundle", "done");
			await expect(isPathExists(Path.join(cwd, ".nadle"))).resolves.toBe(false);
		});
	});
});
