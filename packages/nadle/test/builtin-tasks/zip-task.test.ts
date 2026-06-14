import fixturify from "fixturify";
import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { settle, fixture, getStdout, withGeneratedFixture } from "setup";

const makeFixture = (config: string) =>
	fixture()
		.packageJson("zip-task")
		.file("assets/bar.txt", "bar contents")
		.file("assets/sub/baz.txt", "baz contents")
		.configRaw([`import { tasks, ZipTask, UnzipTask } from "nadle";`, ``, config].join("\n"))
		.build();

const readFiles = (cwd: string) =>
	fixturify.readSync(cwd, { ignore: ["nadle.config.ts", "package.json", "node_modules", "*.zip"] }) as Record<string, unknown>;

describe.skipIf(isWindows).concurrent("zipTask and unzipTask", () => {
	it("round-trips a directory through zip and unzip", () =>
		withGeneratedFixture({
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`zip`);
				await getStdout(exec`unzip`);

				expect(readFiles(cwd)["extracted"]).toEqual({ "bar.txt": "bar contents", sub: { "baz.txt": "baz contents" } });
			},
			files: makeFixture(
				[
					`tasks.register("zip", { run: ZipTask, options: { from: "assets", archive: "out/bundle.zip" } });`,
					`tasks.register("unzip", { run: UnzipTask, options: { archive: "out/bundle.zip", into: "extracted" } });`
				].join("\n")
			)
		}));

	it("stores entries under the prefix", () =>
		withGeneratedFixture({
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`zip`);
				await getStdout(exec`unzip`);

				expect(readFiles(cwd)["extracted"]).toEqual({ bundle: { "bar.txt": "bar contents", sub: { "baz.txt": "baz contents" } } });
			},
			files: makeFixture(
				[
					`tasks.register("zip", { run: ZipTask, options: { from: "assets", archive: "bundle.zip", prefix: "bundle" } });`,
					`tasks.register("unzip", { run: UnzipTask, options: { archive: "bundle.zip", into: "extracted" } });`
				].join("\n")
			)
		}));

	it("extracts only entries matching include patterns", () =>
		withGeneratedFixture({
			testFn: async ({ cwd, exec }) => {
				await getStdout(exec`zip`);
				await getStdout(exec`unzip`);

				expect(readFiles(cwd)["extracted"]).toEqual({ sub: { "baz.txt": "baz contents" } });
			},
			files: makeFixture(
				[
					`tasks.register("zip", { run: ZipTask, options: { from: "assets", archive: "bundle.zip" } });`,
					`tasks.register("unzip", { run: UnzipTask, options: { archive: "bundle.zip", into: "extracted", include: "sub/**" } });`
				].join("\n")
			)
		}));

	it("fails when the archive does not exist", () =>
		withGeneratedFixture({
			files: makeFixture(`tasks.register("unzip", { run: UnzipTask, options: { archive: "missing.zip", into: "extracted" } });`),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`unzip --stacktrace`);

				expect(exitCode).not.toBe(0);
				expect(stdout + stderr).toContain("does not exist");
			}
		}));

	it("fails on missing source when strict", () =>
		withGeneratedFixture({
			files: makeFixture(`tasks.register("zip", { run: ZipTask, options: { strict: true, from: "missing", archive: "bundle.zip" } });`),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`zip --stacktrace`);

				expect(exitCode).not.toBe(0);
				expect(stdout + stderr).toContain("does not exist");
			}
		}));
});
