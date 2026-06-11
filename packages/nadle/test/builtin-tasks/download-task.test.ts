import Http from "node:http";
import type Net from "node:net";
import Crypto from "node:crypto";

import fixturify from "fixturify";
import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { settle, fixture, getStdout, withGeneratedFixture } from "setup";

const CONTENT = "downloaded contents";
const DIGEST = Crypto.createHash("sha256").update(CONTENT).digest("hex");

const makeFixture = (config: string) =>
	fixture().packageJson("download-task").configRaw([`import { tasks, DownloadTask } from "nadle";`, ``, config].join("\n")).build();

const readFiles = (cwd: string) =>
	fixturify.readSync(cwd, { ignore: ["nadle.config.ts", "package.json", "node_modules"] }) as Record<string, unknown>;

async function withServer(handler: Http.RequestListener, testFn: (baseUrl: string) => Promise<void>) {
	const server = Http.createServer(handler);

	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

	try {
		await testFn(`http://127.0.0.1:${(server.address() as Net.AddressInfo).port}`);
	} finally {
		server.close();
	}
}

describe.skipIf(isWindows).concurrent("downloadTask", () => {
	it("downloads a file into the destination", () =>
		withServer(
			(_request, response) => response.end(CONTENT),
			(baseUrl) =>
				withGeneratedFixture({
					files: makeFixture(`tasks.register("download", DownloadTask, { url: "${baseUrl}/file.txt", into: "dist" });`),
					testFn: async ({ cwd, exec }) => {
						await getStdout(exec`download`);

						expect(readFiles(cwd)["dist"]).toEqual({ "file.txt": CONTENT });
					}
				})
		));

	it("verifies the sha256 digest and fails on mismatch", () =>
		withServer(
			(_request, response) => response.end(CONTENT),
			(baseUrl) =>
				withGeneratedFixture({
					files: makeFixture(`tasks.register("download", DownloadTask, { url: "${baseUrl}/file.txt", into: "dist", sha256: "${"0".repeat(64)}" });`),
					testFn: async ({ cwd, exec }) => {
						const { stdout, stderr, exitCode } = await settle(exec`download --stacktrace`);

						expect(exitCode).not.toBe(0);
						expect(stdout + stderr).toContain("Digest mismatch");
						expect(readFiles(cwd)["dist"]).toEqual({});
					}
				})
		));

	it("skips the download when the existing file matches the digest", () =>
		withServer(
			(_request, response) => {
				response.statusCode = 500;
				response.end("server must not be hit");
			},
			(baseUrl) =>
				withGeneratedFixture({
					testFn: async ({ exec }) => {
						const stdout = await getStdout(exec`download --log-level info`);

						expect(stdout).toContain("Skip download");
					},
					files: {
						...makeFixture(`tasks.register("download", DownloadTask, { url: "${baseUrl}/file.txt", into: "dist", sha256: "${DIGEST}" });`),
						dist: { "file.txt": CONTENT }
					}
				})
		));

	it("fails on a non-success status", () =>
		withServer(
			(_request, response) => {
				response.statusCode = 404;
				response.end("not found");
			},
			(baseUrl) =>
				withGeneratedFixture({
					files: makeFixture(`tasks.register("download", DownloadTask, { url: "${baseUrl}/file.txt", into: "dist" });`),
					testFn: async ({ exec }) => {
						const { stdout, stderr, exitCode } = await settle(exec`download --stacktrace`);

						expect(exitCode).not.toBe(0);
						expect(stdout + stderr).toContain("status 404");
					}
				})
		));
});
