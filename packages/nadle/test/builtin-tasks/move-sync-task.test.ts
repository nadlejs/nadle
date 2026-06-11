import fixturify from "fixturify";
import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { settle, fixture, getStdout, withGeneratedFixture } from "setup";

const makeFixture = (config: string) =>
	fixture()
		.packageJson("move-sync-task")
		.file("assets/bar.txt", "bar contents")
		.file("assets/sub/baz.txt", "baz contents")
		.file("other/qux.txt", "qux contents")
		.configRaw([`import { tasks, MoveTask, SyncTask, CopyTask } from "nadle";`, ``, config].join("\n"))
		.build();

const readFiles = (cwd: string) =>
	fixturify.readSync(cwd, { ignore: ["nadle.config.ts", "package.json", "node_modules"] }) as Record<string, unknown>;

describe.skipIf(isWindows).concurrent("moveTask", () => {
	it("moves a directory into the destination and removes the sources", () =>
		withGeneratedFixture({
			files: makeFixture(`tasks.register("move", MoveTask, { from: "assets", into: "dist" });`),
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`move`);

				const files = readFiles(cwd);

				expect(files["dist"]).toEqual({ "bar.txt": "bar contents", sub: { "baz.txt": "baz contents" } });
				expect(files["assets"]).toEqual({ sub: {} });
			}
		}));

	it("keeps the source for files skipped by the overwrite policy", () =>
		withGeneratedFixture({
			files: makeFixture(
				[
					`tasks.register("seed", CopyTask, { from: "other", into: "dist", rename: { "qux.txt": "bar.txt" } });`,
					`tasks.register("move", MoveTask, { from: "assets", into: "dist", overwrite: "skip" });`
				].join("\n")
			),
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`seed`);
				await getStdout(exec`move`);

				const files = readFiles(cwd);

				// dist/bar.txt existed (from seed) — move skipped it, source kept.
				expect(files["dist"]).toEqual({ "bar.txt": "qux contents", sub: { "baz.txt": "baz contents" } });
				expect(files["assets"]).toEqual({ sub: {}, "bar.txt": "bar contents" });
			}
		}));

	it("fails on missing source when strict", () =>
		withGeneratedFixture({
			files: makeFixture(`tasks.register("move", MoveTask, { strict: true, from: "missing", into: "dist" });`),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`move --stacktrace`);

				expect(exitCode).not.toBe(0);
				expect(stdout + stderr).toContain("does not exist");
			}
		}));
});

describe.skipIf(isWindows).concurrent("syncTask", () => {
	it("mirrors the source, deleting extraneous files and empty directories", () =>
		withGeneratedFixture({
			files: makeFixture(
				[
					`tasks.register("seed", CopyTask, { from: "other", into: "dist/stale" });`,
					`tasks.register("sync", SyncTask, { from: "assets", into: "dist" });`
				].join("\n")
			),
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`seed`);
				await getStdout(exec`sync`);

				expect(readFiles(cwd)["dist"]).toEqual({ "bar.txt": "bar contents", sub: { "baz.txt": "baz contents" } });
			}
		}));

	it("keeps files matching preserve patterns", () =>
		withGeneratedFixture({
			files: makeFixture(
				[
					`tasks.register("seed", CopyTask, { from: "other", into: "dist" });`,
					`tasks.register("sync", SyncTask, { from: "assets", into: "dist", preserve: ["qux.*"] });`
				].join("\n")
			),
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`seed`);
				await getStdout(exec`sync`);

				expect(readFiles(cwd)["dist"]).toEqual({ "bar.txt": "bar contents", "qux.txt": "qux contents", sub: { "baz.txt": "baz contents" } });
			}
		}));

	it("overwrites stale content at the destination", () =>
		withGeneratedFixture({
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`seed`);
				await getStdout(exec`sync`);

				expect(readFiles(cwd)["dist"]).toEqual({ "bar.txt": "bar contents", sub: { "baz.txt": "baz contents" } });
			},
			files: makeFixture(
				[
					`tasks.register("seed", CopyTask, { from: "other", into: "dist", rename: { "qux.txt": "bar.txt" } });`,
					`tasks.register("sync", SyncTask, { from: "assets", into: "dist" });`
				].join("\n")
			)
		}));
});
