import fixturify from "fixturify";
import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { settle, fixture, getStdout, expectPass, withFixture, withGeneratedFixture } from "setup";

describe.skipIf(isWindows)("copyTask", () => {
	const files: fixturify.DirJSON = {
		"foo.txt": "foo contents",
		assets: {
			"bar.txt": "bar contents",
			sub: { "baz.txt": "baz contents" }
		}
	};

	describe("given a folder path", () => {
		it("can copy it", async () => {
			await withFixture({
				files,
				fixtureDir: "copy-task",
				testFn: async ({ exec, getFiles }) => {
					await expectPass(exec`copyAssets`);

					expect(getFiles()).toMatchInlineSnapshot(`
                                                {
                                                  assets: {
                                                    bar.txt: bar contents,
                                                    sub: {
                                                      baz.txt: baz contents,
                                                    },
                                                  },
                                                  dist: {
                                                    bar.txt: bar contents,
                                                    sub: {
                                                      baz.txt: baz contents,
                                                    },
                                                  },
                                                  foo.txt: foo contents,
                                                }
                                        `);
				}
			});
		});
	});

	describe("given a file path", () => {
		it("copies it into the destination directory", async () => {
			await withFixture({
				files,
				fixtureDir: "copy-task",
				testFn: async ({ exec, getFiles }) => {
					await expectPass(exec`copyFoo`);

					expect(getFiles()).toMatchInlineSnapshot(`
						{
						  assets: {
						    bar.txt: bar contents,
						    sub: {
						      baz.txt: baz contents,
						    },
						  },
						  dist: {
						    foo.txt: foo contents,
						  },
						  foo.txt: foo contents,
						}
					`);
				}
			});
		});
	});

	describe("given a nested destination", () => {
		it("creates directories automatically", async () => {
			await withFixture({
				files,
				fixtureDir: "copy-task",
				testFn: async ({ exec, getFiles }) => {
					await expectPass(exec`copyToNested`);

					expect(getFiles()).toMatchInlineSnapshot(`
						{
						  assets: {
						    bar.txt: bar contents,
						    sub: {
						      baz.txt: baz contents,
						    },
						  },
						  dist: {
						    sub: {
						      nested: {
						        foo.txt: foo contents,
						      },
						    },
						  },
						  foo.txt: foo contents,
						}
					`);
				}
			});
		});
	});

	describe("with include and exclude options", () => {
		it("copies only matching files", async () => {
			await withFixture({
				files,
				fixtureDir: "copy-task",
				testFn: async ({ exec, getFiles }) => {
					await expectPass(exec`copyWithFilter`);

					expect(getFiles()).toMatchInlineSnapshot(`
                                                {
                                                  assets: {
                                                    bar.txt: bar contents,
                                                    sub: {
                                                      baz.txt: baz contents,
                                                    },
                                                  },
                                                  dist: {
                                                    sub: {
                                                      baz.txt: baz contents,
                                                    },
                                                  },
                                                  foo.txt: foo contents,
                                                }
                                        `);
				}
			});
		});
	});
});

describe.skipIf(isWindows).concurrent("copyTask with into", () => {
	const makeFixture = (config: string) =>
		fixture()
			.packageJson("copy-task-into")
			.file("foo.txt", "foo contents")
			.file("assets/bar.txt", "bar contents")
			.file("assets/sub/baz.txt", "baz contents")
			.file("other/qux.txt", "qux contents")
			.configRaw([`import { tasks, CopyTask } from "nadle";`, ``, config].join("\n"))
			.build();

	const readDist = (cwd: string) =>
		(fixturify.readSync(cwd, { ignore: ["nadle.config.ts", "package.json", "node_modules"] }) as Record<string, unknown>)["dist"];

	it("copies a directory into the destination preserving structure", () =>
		withGeneratedFixture({
			files: makeFixture(`tasks.register("copy", CopyTask, { from: "assets", into: "dist" });`),
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`copy`);

				expect(readDist(cwd)).toEqual({ "bar.txt": "bar contents", sub: { "baz.txt": "baz contents" } });
			}
		}));

	it("copies multiple sources, files and selectors mixed", () =>
		withGeneratedFixture({
			files: makeFixture(
				`tasks.register("copy", CopyTask, { from: ["foo.txt", { dir: "assets", include: "**/*.txt", exclude: "bar.txt" }], into: "dist" });`
			),
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`copy`);

				expect(readDist(cwd)).toEqual({ "foo.txt": "foo contents", sub: { "baz.txt": "baz contents" } });
			}
		}));

	it("flattens source structure when flatten is set", () =>
		withGeneratedFixture({
			files: makeFixture(`tasks.register("copy", CopyTask, { flatten: true, from: ["assets", "other"], into: "dist" });`),
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`copy`);

				expect(readDist(cwd)).toEqual({ "bar.txt": "bar contents", "baz.txt": "baz contents", "qux.txt": "qux contents" });
			}
		}));

	it("renames files by base name", () =>
		withGeneratedFixture({
			files: makeFixture(`tasks.register("copy", CopyTask, { from: "assets", into: "dist", rename: { "bar.txt": "renamed.txt" } });`),
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`copy`);

				expect(readDist(cwd)).toEqual({ "renamed.txt": "bar contents", sub: { "baz.txt": "baz contents" } });
			}
		}));

	it("fails when flattening collides", () =>
		withGeneratedFixture({
			files: makeFixture(`tasks.register("copy", CopyTask, { flatten: true, into: "dist", from: [{ dir: "assets" }, { dir: "assets" }] });`),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`copy --stacktrace`);

				expect(exitCode).not.toBe(0);
				expect(stdout + stderr).toContain("map to the same destination");
			}
		}));

	it("respects overwrite skip", () =>
		withGeneratedFixture({
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`seed`);
				await getStdout(exec`copy`);

				expect((readDist(cwd) as { sub: Record<string, string> }).sub).toEqual({ "baz.txt": "baz contents" });
			},
			files: makeFixture(
				[
					`tasks.register("seed", CopyTask, { from: "assets", into: "dist" });`,
					`tasks.register("copy", CopyTask, { from: "other", into: "dist/sub", overwrite: "skip", rename: { "qux.txt": "baz.txt" } });`
				].join("\n")
			)
		}));

	it("fails on existing destination with overwrite error", () =>
		withGeneratedFixture({
			files: makeFixture(
				[
					`tasks.register("seed", CopyTask, { from: "assets", into: "dist" });`,
					`tasks.register("copy", CopyTask, { from: "assets", into: "dist", overwrite: "error" });`
				].join("\n")
			),
			testFn: async ({ exec }) => {
				await getStdout(exec`seed`);
				const { stdout, stderr, exitCode } = await settle(exec`copy --stacktrace`);

				expect(exitCode).not.toBe(0);
				expect(stdout + stderr).toContain("already exists");
			}
		}));

	it("warns and succeeds on missing source by default", () =>
		withGeneratedFixture({
			files: makeFixture(`tasks.register("copy", CopyTask, { from: "missing", into: "dist" });`),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`copy`);

				expect(exitCode).toBe(0);
				expect(stdout + stderr).toContain("does not exist");
			}
		}));

	it("fails on missing source when strict", () =>
		withGeneratedFixture({
			files: makeFixture(`tasks.register("copy", CopyTask, { strict: true, from: "missing", into: "dist" });`),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`copy --stacktrace`);

				expect(exitCode).not.toBe(0);
				expect(stdout + stderr).toContain("does not exist");
			}
		}));
});
