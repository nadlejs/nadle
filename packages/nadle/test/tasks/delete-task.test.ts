import type fixturify from "fixturify";
import { it, expect, describe } from "vitest";
import { expectPass, withFixture } from "setup";

describe("ExecTask", { retry: 0 }, () => {
	const files: fixturify.DirJSON = {
		"foo.txt": "foo.txt contents",
		a: {
			"bar.txt": "bar.txt contents",
			"bas.json": "bas.json contents"
		},
		b: {
			"baz.txt": "baz.txt contents",
			b1: { "qux.json": "qux.json contents" }
		}
	};

	describe("given a folder name", () => {
		it("can delete it", async () => {
			await withFixture({
				files,
				configName: "delete-task",
				testFn: async ({ exec, getFiles }) => {
					await expectPass(exec`deleteFolderA`);
					expect(getFiles()).toMatchInlineSnapshot(`
						{
						  b: {
						    b1: {
						      qux.json: qux.json contents,
						    },
						    baz.txt: baz.txt contents,
						  },
						  foo.txt: foo.txt contents,
						}
					`);
				}
			});
		});
	});

	describe("given a folder path", () => {
		it("can delete it", async () => {
			await withFixture({
				files,
				configName: "delete-task",
				testFn: async ({ exec, getFiles }) => {
					await expectPass(exec`deleteFolderB1`);
					expect(getFiles()).toMatchInlineSnapshot(`
						{
						  a: {
						    bar.txt: bar.txt contents,
						    bas.json: bas.json contents,
						  },
						  b: {
						    baz.txt: baz.txt contents,
						  },
						  foo.txt: foo.txt contents,
						}
					`);
				}
			});
		});
	});

	describe("given a file path", () => {
		it("can delete it", async () => {
			await withFixture({
				files,
				configName: "delete-task",
				testFn: async ({ exec, getFiles }) => {
					await expectPass(exec`deleteFileBaz`);
					expect(getFiles()).toMatchInlineSnapshot(`
						{
						  a: {
						    bar.txt: bar.txt contents,
						    bas.json: bas.json contents,
						  },
						  b: {
						    b1: {
						      qux.json: qux.json contents,
						    },
						  },
						  foo.txt: foo.txt contents,
						}
					`);
				}
			});
		});
	});

	describe("given multiple file paths", () => {
		it("can delete them", async () => {
			await withFixture({
				files,
				configName: "delete-task",
				testFn: async ({ exec, getFiles }) => {
					await expectPass(exec`deleteFilesFooBar`);
					expect(getFiles()).toMatchInlineSnapshot(`
						{
						  a: {
						    bas.json: bas.json contents,
						  },
						  b: {
						    b1: {
						      qux.json: qux.json contents,
						    },
						    baz.txt: baz.txt contents,
						  },
						}
					`);
				}
			});
		});
	});

	describe("given a glob", () => {
		it("can delete all files match the glob", async () => {
			await withFixture({
				files,
				configName: "delete-task",
				testFn: async ({ exec, getFiles }) => {
					await expectPass(exec`deleteJsonFiles`);
					expect(getFiles()).toMatchInlineSnapshot(`
						{
						  a: {
						    bar.txt: bar.txt contents,
						  },
						  b: {
						    b1: {},
						    baz.txt: baz.txt contents,
						  },
						  foo.txt: foo.txt contents,
						}
					`);
				}
			});
		});
	});

	describe("given a glob with enable info log", () => {
		it("can print will-delete files", async () => {
			await withFixture({
				files,
				configName: "delete-task",
				testFn: async ({ exec, getFiles }) => {
					await expectPass(exec`deleteJsonFiles --log-level info`);
					expect(getFiles()).toMatchInlineSnapshot(`
						{
						  a: {
						    bar.txt: bar.txt contents,
						  },
						  b: {
						    b1: {},
						    baz.txt: baz.txt contents,
						  },
						  foo.txt: foo.txt contents,
						}
					`);
				}
			});
		});
	});
});
