import { isWindows } from "std-env";
import type fixturify from "fixturify";
import { it, expect, describe } from "vitest";
import { expectPass, withFixture } from "setup";

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
				configName: "copy-task",
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
		it("can copy it", async () => {
			await withFixture({
				files,
				configName: "copy-task",
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
						  dist: foo contents,
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
				configName: "copy-task",
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
						      nested: foo contents,
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
				configName: "copy-task",
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
